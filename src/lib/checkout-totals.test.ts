import { describe, it, expect } from "vitest";
import { computeTotals, hasPhysicalItems, totalWeightKg } from "./checkout-totals";
import { parseEtdDays, resolveShippingQuote, DEFAULT_SHIPPING_SETTINGS } from "./shipping";
import type { CartItem } from "./cart";

const item = (over: Partial<CartItem> = {}): CartItem => ({
  id: "p1",
  title: "sensor",
  price: 50,
  gst_rate: 9,
  thumbnail_url: null,
  qty: 1,
  is_course: false,
  course_id: null,
  ...over,
});

describe("computeTotals", () => {
  it("reproduces the app's basket: ₹100 + ₹9 GST + ₹89 delivery = ₹198", () => {
    const totals = computeTotals({
      items: [item({ id: "p1" }), item({ id: "p2", title: "arduino uno device2" })],
      shippingFee: 89,
    });

    expect(totals.subtotal).toBe(100);
    expect(totals.tax).toBe(9);
    expect(totals.shippingFee).toBe(89);
    expect(totals.total).toBe(198);
    expect(totals.itemCount).toBe(2);
  });

  it("charges GST per item when rates differ", () => {
    const totals = computeTotals({
      items: [
        item({ id: "kit", price: 100, gst_rate: 9 }),
        item({ id: "course", price: 100, gst_rate: 18, is_course: true, course_id: "c1" }),
      ],
    });

    expect(totals.subtotal).toBe(200);
    expect(totals.tax).toBe(27); // 9 + 18
    expect(totals.avgGstRate).toBe(14); // label only
  });

  it("spreads a coupon across items before taxing them", () => {
    const totals = computeTotals({
      items: [item({ price: 100, qty: 2, gst_rate: 10 })],
      discount: 50,
    });

    expect(totals.taxable).toBe(150);
    expect(totals.tax).toBe(15);
    expect(totals.total).toBe(165);
  });

  it("never lets a discount push the total below zero", () => {
    const totals = computeTotals({ items: [item({ price: 100 })], discount: 500 });
    expect(totals.discount).toBe(100);
    expect(totals.total).toBe(0);
  });

  it("counts quantity, not lines", () => {
    expect(computeTotals({ items: [item({ qty: 3 })] }).itemCount).toBe(3);
  });
});

describe("hasPhysicalItems", () => {
  it("is false for a course-only cart, so no delivery is charged", () => {
    const items = [item({ is_course: true, course_id: "c1" })];
    expect(hasPhysicalItems(items)).toBe(false);

    const quote = resolveShippingQuote({
      hasPhysical: false,
      subtotal: 100,
      rate: null,
      settings: DEFAULT_SHIPPING_SETTINGS,
    });
    expect(quote.fee).toBe(0);
    expect(quote.source).toBe("digital");
  });

  it("is true as soon as one physical product is present", () => {
    expect(hasPhysicalItems([item({ is_course: true, course_id: "c1" }), item()])).toBe(true);
  });
});

describe("totalWeightKg", () => {
  it("ignores courses and defaults physical items to 0.5kg", () => {
    expect(totalWeightKg([item(), item({ id: "p2" })])).toBe(1);
    expect(totalWeightKg([item({ is_course: true, course_id: "c1" })])).toBe(0.1);
  });
});

describe("resolveShippingQuote", () => {
  const settings = { fee: 49, remoteFee: 149, threshold: 999 };

  it("prefers the live courier rate", () => {
    const quote = resolveShippingQuote({
      hasPhysical: true,
      subtotal: 100,
      rate: { success: true, fee: 89, courier: "Xpressbees Air", etd: "2" },
      settings,
    });

    expect(quote).toMatchObject({
      fee: 89,
      courier: "Xpressbees Air",
      etdDays: 2,
      source: "shiprocket",
    });
  });

  it("falls back to the flat fee when the courier fails", () => {
    const quote = resolveShippingQuote({
      hasPhysical: true,
      subtotal: 100,
      rate: null,
      settings,
      state: "Telangana",
    });
    expect(quote).toMatchObject({ fee: 49, source: "fallback" });
  });

  it("charges the remote rate for the North East and the islands", () => {
    const quote = resolveShippingQuote({
      hasPhysical: true,
      subtotal: 100,
      rate: null,
      settings,
      state: "Mizoram",
    });
    expect(quote.fee).toBe(149);
  });

  it("gives free delivery above the threshold even when a courier quoted", () => {
    const quote = resolveShippingQuote({
      hasPhysical: true,
      subtotal: 1200,
      rate: { success: true, fee: 89, courier: "Xpressbees Air", etd: "2" },
      settings,
    });
    expect(quote.fee).toBe(0);
    expect(quote.courier).toBe("Xpressbees Air");
  });
});

describe("parseEtdDays", () => {
  it("reads plain counts and phrases", () => {
    expect(parseEtdDays("2")).toBe(2);
    expect(parseEtdDays("3 Days")).toBe(3);
    expect(parseEtdDays("Delivery in 4-5 days")).toBe(4);
  });

  it("converts a delivery date into days from now", () => {
    const inThreeDays = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
    expect(parseEtdDays(inThreeDays)).toBeGreaterThanOrEqual(2);
  });

  it("returns null when there's nothing usable", () => {
    expect(parseEtdDays(null)).toBeNull();
    expect(parseEtdDays("")).toBeNull();
    expect(parseEtdDays("unknown")).toBeNull();
  });
});

describe("delivery is not charged before a destination is known", () => {
  it("would otherwise show the flat fallback fee on step 1", () => {
    // With no address picked, resolveShippingQuote falls back to the flat fee.
    // Checkout must hold this out of the total until a PIN code exists,
    // otherwise the price moves under the customer between steps.
    const quote = resolveShippingQuote({
      hasPhysical: true,
      subtotal: 100,
      rate: null,
      settings: DEFAULT_SHIPPING_SETTINGS,
    });
    expect(quote.fee).toBe(DEFAULT_SHIPPING_SETTINGS.fee);

    const pending = computeTotals({ items: [item(), item({ id: "p2" })], shippingFee: 0 });
    expect(pending.total).toBe(109); // 100 + 9 GST, no delivery yet

    const settled = computeTotals({ items: [item(), item({ id: "p2" })], shippingFee: 89 });
    expect(settled.total).toBe(198);
  });
});

describe("courier field-name tolerance", () => {
  it("reads the courier and ETA whichever key the function used", () => {
    const fromEtd = resolveShippingQuote({
      hasPhysical: true,
      subtotal: 100,
      rate: { success: true, fee: 89, courier: "Xpressbees Air", etd: "2 Days" },
      settings: DEFAULT_SHIPPING_SETTINGS,
    });
    expect(fromEtd.courier).toBe("Xpressbees Air");
    expect(fromEtd.etdDays).toBe(2);
  });
});
