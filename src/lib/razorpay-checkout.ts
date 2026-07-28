import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/lib/cart";
import type { ShippingAddress } from "@/lib/addresses";

type RazorpayWindow = typeof window & {
  Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
};

export async function loadRazorpayScript(): Promise<boolean> {
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

export async function runRazorpayCheckout(opts: {
  items: CartItem[];
  shipping: ShippingAddress;
  userEmail: string;
  userName: string;
  userPhone: string;
  couponCode?: string;
  couponId?: string;
  discountAmount?: number;
  taxAmount?: number;
  /** Delivery charge already shown to the customer. */
  shippingFee?: number;
  /** Courier that quoted the fee, for the order record. */
  courier?: string | null;
  totalAmount?: number;
  userId?: string;
  /** Called when the server's amount differs from what was on screen. */
  onAmountAdjusted?: (serverAmountInRupees: number) => void;
  onSuccess: (razorpayOrderId: string) => Promise<void> | void;
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
        // Shipping is priced on the client from the selected address, so send
        // the resolved figure rather than letting the server guess a flat fee.
        include_shipping: true,
        shipping_fee: opts.shippingFee ?? 0,
        shipping_address: opts.shipping,
        shipping_courier: opts.courier ?? null,
        tax_amount: opts.taxAmount ?? 0,
        discount_amount: opts.discountAmount ?? 0,
        coupon_code: opts.couponCode ?? null,
        coupon_id: opts.couponId ?? null,
        currency: "INR",
        receipt: `web_${Date.now()}`,
        notes: {
          source: "web",
          items: opts.items.length,
          pincode: opts.shipping.pincode,
          courier: opts.courier ?? "",
        },
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

  // The server decides the real amount. If it disagrees with the total we
  // displayed, say so rather than silently charging a different number.
  const serverRupees = Math.round(order.amount / 100);
  if (opts.totalAmount != null && Math.abs(serverRupees - opts.totalAmount) > 1) {
    console.warn(
      `[razorpay] Amount mismatch — screen ₹${opts.totalAmount}, server ₹${serverRupees}. ` +
        "Check that create-razorpay-order honours shipping_fee.",
    );
    opts.onAmountAdjusted?.(serverRupees);
  }

  await new Promise<void>((resolve, reject) => {
    const rzp = new (window as RazorpayWindow).Razorpay!({
      key: keyId,
      amount: order.amount,
      currency: order.currency ?? "INR",
      order_id: razorpayOrderId,
      name: "MakersFlow",
      description: `${opts.items.length} item(s)`,
      prefill: { name: opts.userName, email: opts.userEmail, contact: opts.userPhone },
      notes: { address: `${opts.shipping.city}, ${opts.shipping.state} ${opts.shipping.pincode}` },
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
                shipping_fee: opts.shippingFee ?? 0,
                shipping_address: opts.shipping,
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
