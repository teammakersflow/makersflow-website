import { paymentService, type VerifyPaymentResponse } from "@/lib/paymentService";
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
  onSuccess: (razorpayOrderId: string, razorpayPaymentId: string, verification?: VerifyPaymentResponse) => Promise<void> | void;
}) {
  const ok = await loadRazorpayScript();
  if (!ok) throw new Error("Could not load Razorpay. Check your connection.");

  if (opts.items.some((i) => i.is_course)) {
    throw new Error("Cart contains courses. Store checkout supports physical products only.");
  }

  // Deduplicate product lines and strictly validate numeric product IDs as required by Backend (5)
  const productItemsMap = new Map<string, number>();
  for (const item of opts.items) {
    const pid = String(item.id).trim();
    if (!/^\d+$/.test(pid)) {
      throw new Error(`Invalid product ID "${item.id}". Store checkout requires valid numeric product IDs.`);
    }
    const qty = Math.max(1, Math.floor(item.qty || 1));
    productItemsMap.set(pid, (productItemsMap.get(pid) || 0) + qty);
  }

  const itemsPayload = Array.from(productItemsMap.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  if (itemsPayload.length === 0) {
    throw new Error("No physical products found in cart for store checkout.");
  }

  const shippingAddressPayload = opts.shipping
    ? {
        name: opts.shipping.full_name,
        address_line1: opts.shipping.address_line1,
        address_line2: opts.shipping.address_line2 || undefined,
        city: opts.shipping.city,
        state: opts.shipping.state,
        pincode: opts.shipping.pincode,
        phone: opts.shipping.phone,
      }
    : null;

  // Call verified backend POST /payments/create-order via paymentService
  const totalInRupees = Math.max(opts.totalAmount ?? 0, 1);
  const order = await paymentService.createPaymentOrder({
    amount: totalInRupees,
    currency: "INR",
    receipt: `web_${Date.now()}`,
    items: itemsPayload,
    shipping_address: shippingAddressPayload,
    order_type: "product",
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

  let isVerifying = false;

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
        if (isVerifying) return;
        isVerifying = true;

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

          await opts.onSuccess(resp.razorpay_order_id, resp.razorpay_payment_id, verification);
          resolve();
        } catch (err) {
          isVerifying = false;
          reject(err);
        }
      },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rzp.open();
  });
}
