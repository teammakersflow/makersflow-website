import type { CartItem } from "./cart";

/**
 * Pure cart reducer functions — no React, no side-effects, fully unit-testable.
 * CartProvider delegates all state transitions to these.
 */

export function cartAdd(
  items: CartItem[],
  id: string,
  title: string,
  price: number,
  gst_rate: number,
  thumbnail_url: string | null,
  is_course: boolean,
  course_id: string | null,
  qty = 1,
): CartItem[] {
  const existing = items.find((c) => c.id === id);
  if (existing) {
    // Update qty AND refresh gst_rate in case admin changed it
    return items.map((c) =>
      c.id === id ? { ...c, qty: c.qty + qty, gst_rate } : c
    );
  }
  return [...items, { id, title, price, gst_rate, thumbnail_url, qty, is_course, course_id }];
}

export function cartRemove(items: CartItem[], id: string): CartItem[] {
  return items.filter((i) => i.id !== id);
}

export function cartSetQty(items: CartItem[], id: string, qty: number): CartItem[] {
  // qty of 0 or less removes the item from the cart entirely.
  if (qty <= 0) {
    return items.filter((i) => i.id !== id);
  }
  return items.map((i) => (i.id === id ? { ...i, qty } : i));
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.qty, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.qty * i.price, 0);
}
