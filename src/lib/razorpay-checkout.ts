import { paymentService } from "@/lib/paymentService";
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
  onSuccess: (razorpayOrderId: string, razorpayPaymentId: string) => Promise<void> | void;
}) {
  const ok = await loadRazorpayScript();
  if (!ok) throw new Error("Could not load Razorpay. Check your connection.");

  // Call verified backend POST /payments/create-order via paymentService
  const totalInRupees = Math.max(opts.totalAmount ?? 0, 1);
  const order = await paymentService.createPaymentOrder({
    amount: totalInRupees,
    currency: "INR",
    receipt: `web_${Date.now()}`,
  });

  const razorpayOrderId = order.razorpay_order_id;
  const keyId = order.key_id || (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined);

  if (!razorpayOrderId) throw new Error("Payment order missing id");
  if (!keyId) throw new Error("Missing Razorpay key");
  if (!order.amount) throw new Error("Payment order missing amount");

  // The server decides the real amount. If it disagrees with the total we
  // displayed, notify the caller.
  const serverRupees = Math.round(order.amount / 100);
  if (opts.totalAmount != null && Math.abs(serverRupees - opts.totalAmount) > 1) {
    console.warn(
      `[razorpay] Amount mismatch — screen ₹${opts.totalAmount}, server ₹${serverRupees}.`,
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
          // Verify HMAC signature authoritatively via backend POST /payments/verify
          const verification = await paymentService.verifyPayment({
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });

          if (!verification.success) {
            throw new Error(verification.message || "Payment verification failed");
          }

          await opts.onSuccess(resp.razorpay_order_id, resp.razorpay_payment_id);
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
