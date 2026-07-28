import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
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
import { formatPrice } from "@/lib/store-data";
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

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { course: courseParam } = Route.useSearch();
  const { items, subtotal, removeItem, setQty, clear, addItem, syncItems } = useCart();

  const [step, setStep] = useState<CheckoutStepKey>("cart");
  const [promo, setPromo] = useState<PromoState>({ status: "idle" });
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [advancing, setAdvancing] = useState(false);
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

  const goToStep = useCallback((next: CheckoutStepKey) => {
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Emptying the cart from a later step must not strand the customer there.
  useEffect(() => {
    if (items.length === 0 && step !== "cart") setStep("cart");
  }, [items.length, step]);

  // ── Re-sync the cart against the database ────────────────────────────────
  // A cart lives in localStorage forever, so a basket filled weeks ago can
  // carry a stale price, an outdated GST rate, or a wrong `is_course` flag.
  // The last one is the dangerous one: a physical kit mis-flagged as a course
  // silently skips delivery. Look every item up in BOTH tables by its raw id
  // and let the database decide what it actually is.
  const syncedRef = useRef(false);

  useEffect(() => {
    // The cart hydrates from localStorage in the provider's own effect, and
    // child effects run before parent ones — so on the very first pass `items`
    // is still empty. Wait for the real cart, then sync exactly once.
    if (syncedRef.current) return;
    const live = items.filter((i) => !i.id.startsWith("demo-"));
    if (live.length === 0) return;
    syncedRef.current = true;

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
    // `syncedRef` keeps this to a single run despite the `items` dependency.
  }, [items, syncItems]);

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

  // Delivery is only real once we know where the parcel is going. Before an
  // address is picked, the fallback flat fee would otherwise appear as a firm
  // charge and then change — so hold it out of the total until step 2.
  const destinationKnown = /^\d{6}$/.test(selectedAddress?.pincode ?? "");
  // A default address auto-selects on load, so a PIN code can exist before the
  // customer has chosen anything. Delivery still doesn't belong on the cart
  // step — it is only settled once they reach (and confirm) the address step.
  const deliveryPending = needsDelivery && (step === "cart" || !destinationKnown || rateLoading);

  const totals = useMemo(
    () =>
      computeTotals({
        items,
        discount: promo.status === "applied" ? promo.amount : 0,
        shippingFee: deliveryPending ? 0 : quote.fee,
      }),
    [items, promo, quote.fee, deliveryPending],
  );

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

  // ── Step 1 → 2 ────────────────────────────────────────────────────────────
  const continueFromCart = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!user) {
      toast.error("Please sign in to continue");
      navigate({ to: "/login", search: { redirect: "/checkout" } });
      return;
    }

    setAdvancing(true);
    const soldOut = await findSoldOutItem();
    setAdvancing(false);

    if (soldOut) {
      toast.error(`"${soldOut}" just went out of stock. Remove it to continue.`);
      return;
    }
    goToStep("address");
  };

  // ── Step 2 → 3 ────────────────────────────────────────────────────────────
  const continueFromAddress = () => {
    if (!selectedAddress) {
      toast.error(needsDelivery ? "Choose a delivery address" : "Add your billing details");
      return;
    }
    const problem = validateAddress(selectedAddress);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (rateLoading) {
      toast.info("Still checking delivery for this PIN code…");
      return;
    }
    goToStep("payment");
  };

  /** Returns the title of the first out-of-stock item, or null. */
  const findSoldOutItem = async (): Promise<string | null> => {
    const productIds = items.filter((i) => !i.is_course).map((i) => i.id);
    if (productIds.length === 0) return null;

    const { data } = await supabase
      .from("products")
      .select("id, title, stock_quantity, in_stock")
      .in("id", productIds);

    const rows = (data ?? []) as Array<{
      title: string;
      stock_quantity: number;
      in_stock: boolean;
    }>;
    const soldOut = rows.find(
      (p) => p.in_stock === false || (p.stock_quantity !== -1 && p.stock_quantity <= 0),
    );
    return soldOut?.title ?? null;
  };

  // ── Pay ───────────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (paying) return;
    if (!user || !selectedAddress) return;

    setPaying(true);
    try {
      // Re-check stock immediately before charging: a product can sell out
      // between reviewing the cart and confirming payment.
      const soldOut = await findSoldOutItem();
      if (soldOut) {
        toast.error(`"${soldOut}" just went out of stock. Remove it to continue.`);
        goToStep("cart");
        setPaying(false);
        return;
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

          // The order row is written by the edge function under the service
          // role, so poll briefly for it before redirecting.
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

  const addressReady = Boolean(selectedAddress && !validateAddress(selectedAddress));

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

          <div className="mt-5 border-b border-border pb-4">
            <CheckoutSteps current={step} onSelect={goToStep} />
          </div>

          {items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-border bg-card">
              <EmptyCart />
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* ── Step 1: review the cart ───────────────────────────────── */}
              {step === "cart" && (
                <>
                  <OrderSummaryCard
                    items={items}
                    totals={totals}
                    quote={quote}
                    quoteLoading={rateLoading}
                    needsDelivery={needsDelivery}
                    deliveryPending={deliveryPending}
                    promo={promo}
                    onApplyPromo={applyPromo}
                    onRemovePromo={() => setPromo({ status: "idle" })}
                    applyingPromo={applyingPromo}
                    onQty={setQty}
                    onRemove={removeItem}
                  />

                  <StepFooter
                    total={totals.total}
                    totalLabel={deliveryPending ? "Total before delivery" : "Total"}
                  >
                    <PrimaryButton onClick={continueFromCart} loading={advancing}>
                      Continue to address
                    </PrimaryButton>
                  </StepFooter>
                </>
              )}

              {/* ── Step 2: choose where it ships ─────────────────────────── */}
              {step === "address" && (
                <>
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

                  {!addressReady && (
                    <p className="text-sm text-muted-foreground">
                      {addresses.length === 0
                        ? "Add an address above to continue."
                        : "Select an address to continue."}
                    </p>
                  )}

                  <StepFooter
                    total={totals.total}
                    totalLabel={deliveryPending ? "Total before delivery" : "Total"}
                  >
                    <SecondaryButton onClick={() => goToStep("cart")}>Back</SecondaryButton>
                    <PrimaryButton onClick={continueFromAddress} disabled={!addressReady}>
                      Continue to payment
                    </PrimaryButton>
                  </StepFooter>
                </>
              )}

              {/* ── Step 3: pay ───────────────────────────────────────────── */}
              {step === "payment" && (
                <>
                  {selectedAddress && (
                    <section className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {needsDelivery ? "Delivering to" : "Billing to"}
                          </p>
                          <p className="mt-1 font-semibold text-foreground">
                            {selectedAddress.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedAddress.city}, {selectedAddress.state} —{" "}
                            {selectedAddress.pincode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => goToStep("address")}
                          className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-primary transition hover:bg-primary/10"
                        >
                          Change
                        </button>
                      </div>
                    </section>
                  )}

                  <PaymentSection totals={totals} needsDelivery={needsDelivery} />

                  <div className="space-y-5 pt-4">
                    <SlideToPay
                      amount={totals.total}
                      onComplete={handlePay}
                      loading={paying}
                      disabled={!addressReady || items.length === 0}
                      disabledReason="Complete the steps above"
                    />
                    <div className="flex justify-center">
                      <SecondaryButton onClick={() => goToStep("address")} disabled={paying}>
                        Back
                      </SecondaryButton>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Footer & buttons ────────────────────────────────────────────────────────

function StepFooter({
  total,
  totalLabel,
  children,
}: {
  total: number;
  totalLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {totalLabel}
        </p>
        <p className="font-display text-2xl font-bold text-foreground">{formatPrice(total)}</p>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function PrimaryButton({
  onClick,
  children,
  loading,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 sm:flex-none"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
      {!loading && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  );
}
