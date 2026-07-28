import type { CartItem } from "@/lib/cart";

/**
 * Single source of truth for checkout money.
 *
 * Previously the totals were computed twice — once in `routes/checkout.tsx`
 * (used for the Razorpay amount) and again inside `OrderSummary` (used for the
 * on-screen numbers). The two copies could drift, which meant the price the
 * customer read was not necessarily the price they were charged. Everything now
 * goes through `computeTotals`.
 */

export type Totals = {
  /** Sum of price × qty, before discount/GST/shipping. */
  subtotal: number;
  /** Coupon discount, clamped so it can never exceed the subtotal. */
  discount: number;
  /** subtotal − discount. GST is charged on this. */
  taxable: number;
  /** Per-item GST, rounded to whole rupees (matches the mobile app). */
  tax: number;
  /** Delivery charge for this order. */
  shippingFee: number;
  /** taxable + tax + shippingFee — the amount actually charged. */
  total: number;
  /** Total units in the cart (not distinct lines). */
  itemCount: number;
  /** Weighted-average GST %, for the "GST (9%)" label only. */
  avgGstRate: number;
};

/** Physical products need delivery; courses are digital and never do. */
export function hasPhysicalItems(items: CartItem[]): boolean {
  return items.some((i) => !i.is_course);
}

/** Shiprocket prices a shipment by weight. Products may carry `weight_kg`. */
export function totalWeightKg(items: CartItem[]): number {
  const weight = items
    .filter((i) => !i.is_course)
    .reduce((sum, i) => sum + Number((i as unknown as { weight_kg?: number }).weight_kg ?? 0.5), 0);
  return Math.max(weight, 0.1);
}

export function computeTotals(opts: {
  items: CartItem[];
  discount?: number;
  shippingFee?: number;
}): Totals {
  const { items } = opts;

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = Math.min(Math.max(opts.discount ?? 0, 0), subtotal);
  const shippingFee = Math.max(opts.shippingFee ?? 0, 0);

  // GST is per-item, because a kit at 9% and a course at 18% can share a cart.
  // The coupon is spread across items in proportion to their line value so the
  // discount doesn't silently change which item absorbs the tax.
  const tax = Math.round(
    items.reduce((sum, item) => {
      const lineTotal = item.price * item.qty;
      const discountShare = subtotal > 0 ? (lineTotal / subtotal) * discount : 0;
      const lineTaxable = Math.max(0, lineTotal - discountShare);
      return sum + lineTaxable * ((item.gst_rate ?? 18) / 100);
    }, 0),
  );

  const taxable = Math.max(0, subtotal - discount);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  const avgGstRate =
    itemCount > 0
      ? Math.round(items.reduce((s, i) => s + (i.gst_rate ?? 18) * i.qty, 0) / itemCount)
      : 18;

  return {
    subtotal,
    discount,
    taxable,
    tax,
    shippingFee,
    total: taxable + tax + shippingFee,
    itemCount,
    avgGstRate,
  };
}
