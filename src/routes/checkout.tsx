import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import {
  StepIndicator,
  EmptyCart,
  CartRow,
  ShippingForm,
  PaymentPanel,
  OrderSummary,
  STEPS,
  type ShippingAddress,
  type StepKey,
} from "@/components/checkout/CheckoutComponents";
import { useAuth } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchCourseDetail } from "@/lib/explore-data";
import { useCart, type CartItem } from "@/lib/cart";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): { course?: string } => ({
    course: typeof search.course === "string" ? search.course : undefined,
  }),
  head: () => ({ meta: [{ title: "Checkout — MakersFlow" }] }),
  component: CheckoutPage,
});

// States/UTs with higher delivery costs (remote areas of India)
const REMOTE_STATES = new Set([
  "Arunachal Pradesh", "Assam", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Sikkim", "Tripura",
  "Andaman and Nicobar Islands", "Lakshadweep",
  "Jammu and Kashmir", "Ladakh",
]);

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { course: courseParam } = Route.useSearch();
  const { items, subtotal, removeItem, setQty, clear, addItem, updateGstRates } = useCart();

  const [step, setStep] = useState<StepKey>("cart");
  const [couponState, setCouponState] = useState<{
    discount: number; code: string | null; couponId: string | null;
  }>({ discount: 0, code: null, couponId: null });

  // ── Refresh GST rates from DB when checkout opens ───────────────────────
  // This ensures admin GST changes reflect immediately without re-adding to cart
  useEffect(() => {
    const productItems = items.filter(i => !i.is_course && !i.id.startsWith("demo-"));
    const courseItems  = items.filter(i =>  i.is_course && !i.id.startsWith("demo-"));
    if (productItems.length === 0 && courseItems.length === 0) return;

    const productIds = productItems.map(i => i.id);
    const courseIds  = courseItems.map(i => i.course_id ?? i.id);

    Promise.all([
      productIds.length > 0
        ? supabase.from("products").select("id, gst_rate").in("id", productIds)
        : Promise.resolve({ data: [] }),
      courseIds.length > 0
        ? supabase.from("courses").select("id, gst_rate").in("id", courseIds)
        : Promise.resolve({ data: [] }),
    ]).then(([pRes, cRes]) => {
      const gstMap = new Map<string, number>();
      for (const r of [...(pRes.data ?? []), ...(cRes.data ?? [])]) {
        gstMap.set(r.id, r.gst_rate ?? 18);
      }
      if (gstMap.size > 0 && updateGstRates) updateGstRates(gstMap);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Dynamic shipping config from DB ────────────────────────────────────
  const [shippingConfig, setShippingConfig] = useState({
    fee: 49,
    remoteFee: 149,
    threshold: 999,
  });
  useEffect(() => {
    supabase.from("settings")
      .select("key, value")
      .in("key", ["shipping_fee", "shipping_fee_remote", "free_shipping_threshold"])
      .then(({ data }) => {
        if (!data) return;
        const map = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, Number(r.value)]));
        setShippingConfig({
          fee:       map.shipping_fee             ?? 49,
          remoteFee: map.shipping_fee_remote      ?? 149,
          threshold: map.free_shipping_threshold  ?? 999,
        });
      });
  }, []);
  const [shipping, setShipping] = useState<ShippingAddress>({
    full_name: "",
    phone: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (user?.email && !shipping.email) setShipping((s) => ({ ...s, email: user.email ?? "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // If arriving via ?course=<id> (e.g. "Enroll Now" on a paid course),
  // fetch that course and add it to the cart if it isn't already there.
  useEffect(() => {
    if (!courseParam) return;
    let cancelled = false;
    const alreadyInCart = items.some((i) => i.is_course && i.course_id === courseParam);
    if (alreadyInCart) return;

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
        /* fetch failure is non-fatal — user can browse store instead */
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseParam]);

  const isRemoteState = shipping.state ? REMOTE_STATES.has(shipping.state) : false;

  const shippingFee = useMemo(() => {
    if (items.length === 0 || subtotal >= shippingConfig.threshold) return 0;
    return isRemoteState ? shippingConfig.remoteFee : shippingConfig.fee;
  }, [subtotal, items.length, shippingConfig, isRemoteState]);
  const discount = couponState.discount;

  // Per-item GST (mirrors CheckoutComponents.tsx logic)
  const tax = useMemo(() => Math.round(
    items.reduce((sum, item) => {
      const itemSubtotal  = item.price * item.qty;
      const discountShare = subtotal > 0 ? (itemSubtotal / subtotal) * discount : 0;
      const itemTaxable   = Math.max(0, itemSubtotal - discountShare);
      return sum + itemTaxable * ((item.gst_rate ?? 18) / 100);
    }, 0),
  ), [items, subtotal, discount]);

  const taxable = Math.max(0, subtotal - discount);
  const total   = taxable + tax + shippingFee;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const validateShipping = (): string | null => {
    if (!shipping.full_name.trim() || shipping.full_name.trim().length < 2)
      return "Please enter your full name (at least 2 characters)";
    const phoneDigits = shipping.phone.replace(/^\+91\s*/, "").replace(/\D/g, "");
    if (phoneDigits.length !== 10)
      return "Please enter a valid 10-digit mobile number";
    if (!shipping.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email))
      return "Please enter a valid email address";
    if (!shipping.address_line1.trim() || shipping.address_line1.trim().length < 5)
      return "Please enter your full address (house/flat number and street)";
    if (!shipping.city.trim() || shipping.city.trim().length < 2)
      return "Please enter your city name";
    if (!shipping.state)
      return "Please select your state / UT";
    if (!/^\d{6}$/.test(shipping.pincode))
      return "Please enter a valid 6-digit PIN code";
    return null;
  };

  const canContinueFromShipping = () => validateShipping() === null;

  const advance = async () => {
    if (step === "cart") {
      if (items.length === 0) {
        toast.error("Your cart is empty");
        return;
      }
      if (!user) {
        toast.error("Please sign in to continue");
        navigate({ to: "/login", search: { redirect: "/checkout" } });
        return;
      }
      // ── Stock check for physical products ──
      const productItems = items.filter(i => !i.is_course);
      if (productItems.length > 0) {
        const ids = productItems.map(i => i.id);
        const { data: stockData } = await supabase
          .from("products")
          .select("id, title, stock_quantity, in_stock")
          .in("id", ids);

        const outOfStock = (stockData ?? []).filter((p: { stock_quantity: number; in_stock: boolean }) =>
          p.in_stock === false || (p.stock_quantity !== -1 && p.stock_quantity <= 0)
        ) as Array<{ id: string; title: string }>;

        if (outOfStock.length > 0) {
          toast.error(`"${outOfStock[0].title}" is out of stock. Please remove it from your cart.`);
          return;
        }
      }
      setStep("shipping");
    } else if (step === "shipping") {
      const validationError = validateShipping();
      if (validationError) {
        toast.error(validationError);
        return;
      }
      setStep("payment");
    }
  };

  const handlePayment = async () => {
    if (!user) return;
    setPaying(true);
    try {
      await runRazorpayCheckout({
        items,
        shipping,
        userEmail: shipping.email,
        userName: shipping.full_name,
        userPhone: shipping.phone.replace(/\s+/g, ""),
        couponCode: couponState.code ?? undefined,
        couponId: couponState.couponId ?? undefined,
        discountAmount: couponState.discount,
        taxAmount: tax,
        totalAmount: total,
        userId: user.id,
        onSuccess: async (orderId) => {
          const orderRow = {
            user_id: user.id,
            total_amount: total,
            status: "paid",
            razorpay_order_id: orderId,
            coupon_code: couponState.code ?? null,
            discount_amount: couponState.discount,
            tax_amount: tax,
            items: items.map((i) => ({
              id: i.id,
              title: i.title,
              price: i.price,
              qty: i.qty,
              is_course: i.is_course,
              course_id: i.course_id,
            })),
            shipping_address: shipping,
          };
          const { data: inserted } = await supabase
            .from("orders")
            .insert(orderRow)
            .select("id")
            .maybeSingle();
          // Full enrollment shape shared with the mobile app: 1-year access
          // window (expires_at) + completed payment status.
          const enrolledAt = new Date();
          const expiresAt = new Date(enrolledAt.getTime() + 365 * 24 * 60 * 60 * 1000);
          const courseEnrollments = items
            .filter((i) => i.is_course && i.course_id)
            .map((i) => ({
              user_id: user.id,
              course_id: i.course_id!,
              payment_status: "completed",
              status: "active",
              enrolled_at: enrolledAt.toISOString(),
              expires_at: expiresAt.toISOString(),
            }));

          const dbCourseEnrollments = courseEnrollments.filter(
            (e) => !e.course_id.startsWith("demo-"),
          );
          const demoCourseEnrollments = courseEnrollments.filter((e) =>
            e.course_id.startsWith("demo-"),
          );

          if (demoCourseEnrollments.length > 0) {
            try {
              const key = `demo_enrollments_${user.id}`;
              const current = JSON.parse(localStorage.getItem(key) || "[]");
              for (const e of demoCourseEnrollments) {
                if (!current.includes(e.course_id)) current.push(e.course_id);
              }
              localStorage.setItem(key, JSON.stringify(current));
            } catch (e) {
              console.warn("Could not save checkout demo enrollments:", e);
            }
          }

          if (dbCourseEnrollments.length > 0)
            await supabase
              .from("enrollments")
              .upsert(dbCourseEnrollments, { onConflict: "user_id,course_id" });
          // Redirect to dedicated success page
          navigate({
            to: "/payment-success",
            search: {
              order_id: (inserted as { id?: string } | null)?.id ?? orderId,
              total,
            },
          });
          clear();
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
      navigate({
        to: "/payment-failed",
        search: { reason: err instanceof Error ? err.message : "Payment could not be completed.", order_id: "" },
      });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
          <Link
            to="/store"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Continue shopping
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Checkout</h1>
          <StepIndicator stepIndex={stepIndex} />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,360px]">
            <div className="rounded-2xl bg-card p-5 md:p-7">
              <AnimatePresence mode="wait">
                {step === "cart" && (
                  <motion.div
                    key="cart"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    {items.length === 0 ? (
                      <EmptyCart />
                    ) : (
                      <div className="space-y-3">
                        {items.map((i) => (
                          <CartRow
                            key={i.id}
                            item={i}
                            onRemove={() => removeItem(i.id)}
                            onQty={(q) => setQty(i.id, q)}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
                {step === "shipping" && (
                  <motion.div
                    key="shipping"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ShippingForm value={shipping} onChange={setShipping} />
                  </motion.div>
                )}
                {step === "payment" && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <PaymentPanel onPay={handlePayment} paying={paying} total={total} />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-7 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (step === "shipping") setStep("cart");
                    else if (step === "payment") setStep("shipping");
                  }}
                  disabled={step === "cart"}
                  className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:invisible"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                {step !== "payment" && (
                  <button
                    onClick={advance}
                    disabled={step === "cart" && items.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shippingFee={shippingFee}
              total={total}
              isRemoteState={isRemoteState}
              freeShippingThreshold={shippingConfig.threshold}
              onCouponChange={(d, code, id) => setCouponState({ discount: d, code, couponId: id })}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Razorpay helpers ─────────────────────────────────────────────────────── */

type RazorpayWindow = typeof window & {
  Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
};

async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if ((window as RazorpayWindow).Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function runRazorpayCheckout(opts: {
  items: CartItem[];
  shipping: ShippingAddress;
  userEmail: string;
  userName: string;
  userPhone: string;
  couponCode?: string;
  couponId?: string;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  userId?: string;
  onSuccess: (orderId: string) => Promise<void> | void;
}) {
  const ok = await loadRazorpayScript();
  if (!ok) throw new Error("Could not load Razorpay. Check your connection.");

  const { data: orderData, error: orderErr } = await supabase.functions.invoke(
    "create-razorpay-order",
    {
      body: {
        items: opts.items.map((i) => ({
          id: i.is_course ? (i.course_id ?? i.id) : i.id,
          qty: i.qty,
          is_course: i.is_course,
          price: i.price,
        })),
        total_amount: opts.totalAmount,
        include_shipping: true,
        currency: "INR",
        receipt: `web_${Date.now()}`,
        notes: { source: "web", items: opts.items.length },
      },
    },
  );
  if (orderErr || !orderData)
    throw new Error(orderErr?.message ?? "Could not create payment order");

  const order = orderData as {
    id?: string;
    order_id?: string;
    key?: string;
    key_id?: string;
    amount?: number;
    currency?: string;
  };
  const razorpayOrderId = order.id ?? order.order_id;
  const keyId =
    order.key ?? order.key_id ?? (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined);
  if (!razorpayOrderId) throw new Error("Payment order missing id");
  if (!keyId) throw new Error("Missing Razorpay key");
  if (!order.amount) throw new Error("Payment order missing amount");

  await new Promise<void>((resolve, reject) => {
    const rzp = new (window as RazorpayWindow).Razorpay!({
      key: keyId,
      amount: order.amount,
      currency: order.currency ?? "INR",
      order_id: razorpayOrderId,
      name: "MakersFlow",
      description: `${opts.items.length} item(s)`,
      prefill: { name: opts.userName, email: opts.userEmail, contact: opts.userPhone },
      theme: { color: "#4F46E5" },
      handler: async (resp: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const { data: verify, error: verifyErr } = await supabase.functions.invoke(
            "verify-razorpay-payment",
            {
              body: {
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
                user_id: opts.userId,
                amount: order.amount ? order.amount / 100 : 0,
                coupon_code: opts.couponCode,
                coupon_id: opts.couponId,
                discount_amount: opts.discountAmount ?? 0,
                tax_amount: opts.taxAmount ?? 0,
              },
            },
          );
          if (verifyErr) throw new Error(verifyErr.message);
          const v = verify as { verified?: boolean; success?: boolean } | null;
          if (v && (v.verified === false || v.success === false))
            throw new Error("Payment verification failed");
          await opts.onSuccess(resp.razorpay_order_id);
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rzp.open();
  });
}
