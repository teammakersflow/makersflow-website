import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { EmptyCart } from "@/components/checkout/CheckoutComponents";
import { AddressBook } from "@/components/checkout/AddressBook";
import { CheckoutSteps, type CheckoutStepKey } from "@/components/checkout/CheckoutSteps";
import { OrderSummaryCard, type PromoState } from "@/components/checkout/OrderSummaryCard";
import { PaymentSection } from "@/components/checkout/PaymentSection";
import { SlideToPay } from "@/components/checkout/SlideToPay";
import { useAuth } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  createAddress,
  deleteAddress as deleteAddressRow,
  listAddresses,
  updateAddress,
  validateAddress,
  type SavedAddress,
  type ShippingAddress,
} from "@/lib/addresses";
import { useCart, type CartItem } from "@/lib/cart";
import { computeTotals, hasPhysicalItems, totalWeightKg } from "@/lib/checkout-totals";
import { fetchCourseDetail } from "@/lib/explore-data";
import { runRazorpayCheckout } from "@/lib/razorpay-checkout";
import {
  DEFAULT_SHIPPING_SETTINGS,
  fetchShippingSettings,
  fetchShiprocketRate,
  resolveShippingQuote,
  type ShiprocketRate,
  type ShippingSettings,
} from "@/lib/shipping";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): { course?: string } => ({
    course: typeof search.course === "string" ? search.course : undefined,
  }),
  head: () => ({ meta: [{ title: "Checkout — MakersFlow" }] }),
  component: CheckoutPage,
});

type CouponValidation = {
  valid: boolean;
  discount: number;
  label: string;
  coupon_id: string;
  message?: string;
};

type DbRow = Record<string, unknown>;

/** A course lives in the cart as "course-<uuid>"; products keep their own id. */
function courseKeyFor(item: CartItem): string {
  if (item.course_id) return item.course_id;
  return item.id.startsWith("course-") ? item.id.slice("course-".length) : item.id;
}

/** Products and courses spell their image column differently across tables. */
function pickThumbnail(row: DbRow): string | null {
  const direct = (row.thumbnail_url as string) ?? (row.image_url as string);
  if (direct) return direct;
  const images = row.images;
  return Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;
}

function scrollTo(anchor: string) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { course: courseParam } = Route.useSearch();
  const { items, subtotal, removeItem, setQty, clear, addItem, syncItems } = useCart();

  const [promo, setPromo] = useState<PromoState>({ status: "idle" });
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [paying, setPaying] = useState(false);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [rate, setRate] = useState<ShiprocketRate | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  const needsDelivery = hasPhysicalItems(items);
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  // ── Re-sync the cart against the database ────────────────────────────────
  // A cart lives in localStorage forever, so a basket filled weeks ago can
  // carry a stale price, an outdated GST rate, or a wrong `is_course` flag.
  // The last one is the dangerous one: a physical kit mis-flagged as a course
  // silently skips delivery. Look every item up in BOTH tables by its raw id
  // and let the database decide what it actually is.
  useEffect(() => {
    const live = items.filter((i) => !i.id.startsWith("demo-"));
    if (live.length === 0) return;

    // Products sit in the cart under their own uuid, courses under "course-<uuid>".
    const productIds = live.filter((i) => !i.id.startsWith("course-")).map((i) => i.id);
    const courseIds = live.map((i) => courseKeyFor(i));

    let cancelled = false;

    Promise.all([
      productIds.length
        ? supabase.from("products").select("*").in("id", productIds)
        : Promise.resolve({ data: [] }),
      courseIds.length
        ? supabase.from("courses").select("*").in("id", courseIds)
        : Promise.resolve({ data: [] }),
    ]).then(([productRes, courseRes]) => {
      if (cancelled) return;

      const products = new Map<string, DbRow>();
      for (const row of (productRes.data ?? []) as DbRow[]) products.set(String(row.id), row);

      const courses = new Map<string, DbRow>();
      for (const row of (courseRes.data ?? []) as DbRow[]) courses.set(String(row.id), row);

      const patches = new Map<string, Partial<CartItem>>();

      for (const cartItem of live) {
        // A hit in `products` is authoritative — the id IS a product id.
        const product = products.get(cartItem.id);
        if (product) {
          patches.set(cartItem.id, {
            title: String(product.title ?? cartItem.title),
            price: Number(product.price ?? cartItem.price),
            gst_rate: Number(product.gst_rate ?? 18),
            thumbnail_url: pickThumbnail(product) ?? cartItem.thumbnail_url,
            is_course: Boolean(product.is_course),
            course_id: (product.course_id as string) ?? null,
          });
          continue;
        }

        const key = courseKeyFor(cartItem);
        const course = courses.get(key);
        if (course) {
          patches.set(cartItem.id, {
            title: String(course.title ?? cartItem.title),
            price: Number(course.price ?? cartItem.price),
            gst_rate: Number(course.gst_rate ?? 18),
            thumbnail_url: pickThumbnail(course) ?? cartItem.thumbnail_url,
            is_course: true,
            course_id: key,
          });
        }
      }

      if (patches.size > 0) syncItems(patches);
    });

    return () => {
      cancelled = true;
    };
    // Runs once on open — re-running per cart edit would fight the user's typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Admin shipping settings ───────────────────────────────────────────────
  useEffect(() => {
    fetchShippingSettings().then(setSettings);
  }, []);

  // ── "Enroll now" deep link: ?course=<id> ─────────────────────────────────
  useEffect(() => {
    if (!courseParam) return;
    if (items.some((i) => i.is_course && i.course_id === courseParam)) return;

    let cancelled = false;
    fetchCourseDetail(courseParam)
      .then((course) => {
        if (cancelled || !course) return;
        addItem({
          id: `course-${course.id}`,
          title: course.title,
          description: course.description,
          price: course.price ?? 0,
          gst_rate: course.gst_rate ?? 18,
          original_price: course.original_price ?? null,
          category: course.category ?? null,
          subcategory: null,
          thumbnail_url: course.thumbnail_url ?? null,
          images: null,
          rating: course.rating ?? null,
          total_reviews: course.total_reviews ?? null,
          badge: null,
          features: null,
          in_stock: true,
          is_course: true,
          course_id: course.id,
        });
      })
      .catch(() => {
        /* non-fatal — the customer can still browse the store */
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseParam]);

  // ── Saved addresses ───────────────────────────────────────────────────────
  const loadAddresses = useCallback(
    async (preferId?: string) => {
      if (!user) {
        setAddresses([]);
        setAddressesLoading(false);
        return;
      }
      setAddressesLoading(true);
      const rows = await listAddresses(user.id);
      setAddresses(rows);
      setSelectedAddressId((current) => {
        if (preferId && rows.some((r) => r.id === preferId)) return preferId;
        if (current && rows.some((r) => r.id === current)) return current;
        return rows.find((r) => r.is_default)?.id ?? rows[0]?.id ?? null;
      });
      setAddressesLoading(false);
    },
    [user],
  );

  useEffect(() => {
    if (authLoading) return;
    loadAddresses();
  }, [authLoading, loadAddresses]);

  // ── Live Shiprocket rate for the selected PIN code ────────────────────────
  const pincode = selectedAddress?.pincode ?? "";
  const weightKg = useMemo(() => totalWeightKg(items), [items]);

  useEffect(() => {
    if (!needsDelivery || !/^\d{6}$/.test(pincode)) {
      setRate(null);
      setRateLoading(false);
      return;
    }

    let cancelled = false;
    setRateLoading(true);

    fetchShiprocketRate({ pincode, weightKg, declaredValue: Math.max(subtotal, 1) })
      .then((result) => {
        if (!cancelled) setRate(result);
      })
      .finally(() => {
        if (!cancelled) setRateLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pincode, weightKg, subtotal, needsDelivery]);

  const quote = useMemo(
    () =>
      resolveShippingQuote({
        hasPhysical: needsDelivery,
        subtotal,
        rate,
        settings,
        state: selectedAddress?.state,
      }),
    [needsDelivery, subtotal, rate, settings, selectedAddress?.state],
  );

  const totals = useMemo(
    () =>
      computeTotals({
        items,
        discount: promo.status === "applied" ? promo.amount : 0,
        // Don't bill a half-known rate: while the courier is answering, hold at
        // zero rather than flashing the flat fee and moving the total.
        shippingFee: rateLoading && needsDelivery ? 0 : quote.fee,
      }),
    [items, promo, quote.fee, rateLoading, needsDelivery],
  );

  // ── Progress bar state ────────────────────────────────────────────────────
  const completedSteps = useMemo(() => {
    const done: CheckoutStepKey[] = [];
    if (items.length > 0) done.push("cart");
    if (selectedAddress && !validateAddress(selectedAddress)) done.push("details");
    return done;
  }, [items.length, selectedAddress]);

  const currentStep: CheckoutStepKey = completedSteps.includes("details")
    ? "payment"
    : completedSteps.includes("cart")
      ? "details"
      : "cart";

  // ── Promo code ────────────────────────────────────────────────────────────
  const applyPromo = async (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    setApplyingPromo(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-coupon", {
        body: { code, subtotal, item_ids: items.map((i) => i.course_id ?? i.id) },
      });
      if (error) throw new Error(error.message);

      const result = data as CouponValidation;
      if (result?.valid) {
        setPromo({
          status: "applied",
          code,
          amount: result.discount,
          label: result.label,
          couponId: result.coupon_id,
        });
        toast.success(`${code} applied`);
      } else {
        setPromo({ status: "error", message: result?.message ?? "That code isn't valid" });
      }
    } catch {
      setPromo({ status: "error", message: "Could not check that code. Try again." });
    } finally {
      setApplyingPromo(false);
    }
  };

  // ── Address actions ───────────────────────────────────────────────────────
  const saveAddress = async (
    address: ShippingAddress,
    makeDefault: boolean,
    editingId: string | null,
  ): Promise<boolean> => {
    if (!user) {
      toast.error("Sign in to save an address");
      return false;
    }

    const result = editingId
      ? await updateAddress(editingId, user.id, address, makeDefault)
      : await createAddress(user.id, address, makeDefault);

    if (result.error || !result.address) {
      toast.error(result.error ?? "Could not save that address");
      return false;
    }

    await loadAddresses(result.address.id);
    toast.success(editingId ? "Address updated" : "Address saved");
    return true;
  };

  const removeAddress = async (id: string) => {
    const error = await deleteAddressRow(id);
    if (error) {
      toast.error(error);
      return;
    }
    setSelectedAddressId((current) => (current === id ? null : current));
    await loadAddresses();
    toast.success("Address removed");
  };

  // ── Pay ───────────────────────────────────────────────────────────────────
  const payBlockedReason = (): string | null => {
    if (items.length === 0) return "Your cart is empty";
    if (!user) return "Sign in to pay";
    if (!selectedAddress) return needsDelivery ? "Add a delivery address" : "Add billing details";
    const problem = validateAddress(selectedAddress);
    if (problem) return problem;
    if (rateLoading) return "Checking delivery…";
    return null;
  };

  const blockedReason = payBlockedReason();

  const handlePay = async () => {
    if (paying) return;

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!user) {
      toast.error("Please sign in to continue");
      navigate({ to: "/login", search: { redirect: "/checkout" } });
      return;
    }
    if (!selectedAddress) {
      toast.error(needsDelivery ? "Choose a delivery address" : "Add your billing details");
      scrollTo("checkout-address");
      return;
    }

    const addressProblem = validateAddress(selectedAddress);
    if (addressProblem) {
      toast.error(addressProblem);
      scrollTo("checkout-address");
      return;
    }

    setPaying(true);
    try {
      // Stock check happens here, immediately before charging, so a product
      // that sold out while the cart sat open can't be paid for.
      const productIds = items.filter((i) => !i.is_course).map((i) => i.id);
      if (productIds.length > 0) {
        const { data: stock } = await supabase
          .from("products")
          .select("id, title, stock_quantity, in_stock")
          .in("id", productIds);

        const soldOut = (
          (stock ?? []) as Array<{
            id: string;
            title: string;
            stock_quantity: number;
            in_stock: boolean;
          }>
        ).filter((p) => p.in_stock === false || (p.stock_quantity !== -1 && p.stock_quantity <= 0));

        if (soldOut.length > 0) {
          toast.error(`"${soldOut[0].title}" just went out of stock. Remove it to continue.`);
          setPaying(false);
          return;
        }
      }

      const shipping: ShippingAddress = {
        ...selectedAddress,
        email: selectedAddress.email || user.email || "",
      };

      await runRazorpayCheckout({
        items,
        shipping,
        userEmail: shipping.email,
        userName: shipping.full_name,
        userPhone: shipping.phone.replace(/\s+/g, ""),
        couponCode: promo.status === "applied" ? promo.code : undefined,
        couponId: promo.status === "applied" ? promo.couponId : undefined,
        discountAmount: totals.discount,
        taxAmount: totals.tax,
        shippingFee: totals.shippingFee,
        totalAmount: totals.total,
        courier: quote.courier,
        userId: user.id,
        onAmountAdjusted: (serverAmount) => {
          toast.warning(`Order total updated to ₹${serverAmount} by our server.`);
        },
        onSuccess: async (razorpayOrderId) => {
          const demoCourseIds = items
            .filter((i) => i.is_course && i.course_id?.startsWith("demo-"))
            .map((i) => i.course_id!);

          if (demoCourseIds.length > 0) {
            try {
              const key = `demo_enrollments_${user.id}`;
              const current = JSON.parse(localStorage.getItem(key) || "[]") as string[];
              for (const id of demoCourseIds) if (!current.includes(id)) current.push(id);
              localStorage.setItem(key, JSON.stringify(current));
            } catch {
              /* localStorage is a convenience here, not the source of truth */
            }
          }

          // The order row is written by the edge function/webhook under the
          // service role, so poll briefly for it before redirecting.
          let dbOrderId: string | null = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            const { data } = await supabase
              .from("orders")
              .select("id")
              .eq("razorpay_order_id", razorpayOrderId)
              .maybeSingle();
            if (data?.id) {
              dbOrderId = String(data.id);
              break;
            }
            if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
          }

          navigate({
            to: "/payment-success",
            search: { order_id: dbOrderId ?? razorpayOrderId, total: totals.total },
          });
          clear();
        },
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Payment could not be completed.";
      if (reason === "Payment cancelled") {
        toast.info("Payment cancelled — your cart is still here.");
      } else {
        toast.error(reason);
        navigate({ to: "/payment-failed", search: { reason, order_id: "" } });
      }
    } finally {
      setPaying(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
          <Link
            to="/store"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Continue shopping
          </Link>

          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Checkout</h1>

          <div className="sticky top-0 z-20 -mx-4 mt-5 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
            <CheckoutSteps current={currentStep} completed={completedSteps} />
          </div>

          {items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-border bg-card">
              <EmptyCart />
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-6 pb-6">
                <OrderSummaryCard
                  items={items}
                  totals={totals}
                  quote={quote}
                  quoteLoading={rateLoading}
                  needsDelivery={needsDelivery}
                  freeShippingThreshold={settings.threshold}
                  promo={promo}
                  onApplyPromo={applyPromo}
                  onRemovePromo={() => setPromo({ status: "idle" })}
                  applyingPromo={applyingPromo}
                  onQty={setQty}
                  onRemove={removeItem}
                />

                <AddressBook
                  addresses={addresses}
                  selectedId={selectedAddressId}
                  onSelect={setSelectedAddressId}
                  onSave={saveAddress}
                  onDelete={removeAddress}
                  loading={addressesLoading}
                  quote={quote}
                  quoteLoading={rateLoading}
                  needsDelivery={needsDelivery}
                />

                <PaymentSection totals={totals} needsDelivery={needsDelivery} />
              </div>

              <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
                <SlideToPay
                  amount={totals.total}
                  onComplete={handlePay}
                  loading={paying}
                  disabled={blockedReason !== null}
                  disabledReason={blockedReason ?? undefined}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
