import { describe, it, expect } from "vitest";
import type { CartItem } from "./cart";
import { cartAdd, cartRemove, cartSetQty, cartCount, cartSubtotal } from "./cart-reducers";

// ── Helpers ───────────────────────────────────────────────────────────────────

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: "prod-1",
  title: "Arduino Kit",
  price: 2499,
  gst_rate: 18,
  thumbnail_url: null,
  qty: 1,
  is_course: false,
  course_id: null,
  ...overrides,
});

// ── cartAdd ───────────────────────────────────────────────────────────────────

describe("cartAdd", () => {
  it("adds a new item to an empty cart", () => {
    const result = cartAdd([], "prod-1", "Arduino Kit", 2499, 18, null, false, null);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "prod-1", title: "Arduino Kit", price: 2499, qty: 1 });
  });

  it("adds with explicit qty", () => {
    const result = cartAdd([], "prod-1", "Kit", 1000, 18, null, false, null, 3);
    expect(result[0].qty).toBe(3);
  });

  it("increments qty when item already exists", () => {
    const cart = [item({ qty: 2 })];
    const result = cartAdd(cart, "prod-1", "Arduino Kit", 2499, 18, null, false, null, 1);
    expect(result).toHaveLength(1);
    expect(result[0].qty).toBe(3);
  });

  it("adds a second distinct item without touching the first", () => {
    const cart = [item({ id: "a" })];
    const result = cartAdd(cart, "b", "IoT Kit", 1899, 18, null, false, null);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("a");
    expect(result[1].id).toBe("b");
  });
});

// ── cartRemove ────────────────────────────────────────────────────────────────

describe("cartRemove", () => {
  it("removes the item with the given id", () => {
    const cart = [item({ id: "a" }), item({ id: "b" })];
    expect(cartRemove(cart, "a")).toEqual([item({ id: "b" })]);
  });

  it("returns the original array when id not found", () => {
    const cart = [item({ id: "a" })];
    expect(cartRemove(cart, "x")).toHaveLength(1);
  });

  it("returns empty array when removing the only item", () => {
    expect(cartRemove([item()], "prod-1")).toHaveLength(0);
  });
});

// ── cartSetQty ────────────────────────────────────────────────────────────────

describe("cartSetQty", () => {
  it("updates the qty of the targeted item", () => {
    const result = cartSetQty([item()], "prod-1", 5);
    expect(result[0].qty).toBe(5);
  });

  it("does not affect other items", () => {
    const cart = [item({ id: "a" }), item({ id: "b", qty: 2 })];
    const result = cartSetQty(cart, "a", 4);
    expect(result.find((i) => i.id === "b")!.qty).toBe(2);
  });

  it("clamps minimum qty to 1 for qty > 0", () => {
    const result = cartSetQty([item()], "prod-1", 1);
    expect(result[0].qty).toBe(1);
  });

  it("removes the item when qty is set to 0 (filtered out)", () => {
    const result = cartSetQty([item()], "prod-1", 0);
    expect(result).toHaveLength(0);
  });
});

// ── cartCount ─────────────────────────────────────────────────────────────────

describe("cartCount", () => {
  it("returns 0 for an empty cart", () => {
    expect(cartCount([])).toBe(0);
  });

  it("sums qty across all items", () => {
    expect(cartCount([item({ qty: 2 }), item({ id: "b", qty: 3 })])).toBe(5);
  });
});

// ── cartSubtotal ──────────────────────────────────────────────────────────────

describe("cartSubtotal", () => {
  it("returns 0 for an empty cart", () => {
    expect(cartSubtotal([])).toBe(0);
  });

  it("computes price × qty for a single item", () => {
    expect(cartSubtotal([item({ price: 1000, qty: 3 })])).toBe(3000);
  });

  it("sums across multiple items", () => {
    const cart = [item({ id: "a", price: 1000, qty: 2 }), item({ id: "b", price: 500, qty: 1 })];
    expect(cartSubtotal(cart)).toBe(2500);
  });
});
