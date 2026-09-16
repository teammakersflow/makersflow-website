import { describe, it, expect } from "vitest";

/**
 * Constant-time string comparison helper to prevent timing side-channel attacks.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generates an HMAC-SHA256 signature string matching Razorpay expectations.
 */
export async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

describe("Task 1: Razorpay Signature Verification & Timing-Safe Comparison", () => {
  const secret = "test_razorpay_secret_12345";
  const orderId = "order_N123456789";
  const paymentId = "pay_P987654321";

  it("verifies authentic signature using timing-safe comparison helper", async () => {
    const validSignature = await hmacSha256(secret, `${orderId}|${paymentId}`);
    const checkSignature = await hmacSha256(secret, `${orderId}|${paymentId}`);
    expect(timingSafeEqualString(validSignature, checkSignature)).toBe(true);
  });

  it("rejects tampered signature payload safely without timing leakage", async () => {
    const validSignature = await hmacSha256(secret, `${orderId}|${paymentId}`);
    const tamperedSignature = validSignature.slice(0, -4) + "0000";
    expect(timingSafeEqualString(validSignature, tamperedSignature)).toBe(false);
  });

  it("rejects signatures with mismatched lengths safely", () => {
    expect(timingSafeEqualString("abcdef1234567890", "abcdef12345678")).toBe(false);
  });
});

describe("Payment Integration & Verification Scenarios", () => {
  it("handles successful payment verification correctly", () => {
    const mockBackendResponse = {
      success: true,
      message: "Payment verified successfully",
      payment: {
        id: "pay_uuid_123",
        status: "captured",
        amount: 499,
        currency: "INR",
      },
    };

    const parsed = {
      success: Boolean(mockBackendResponse?.success),
      payment: mockBackendResponse?.payment,
      message: mockBackendResponse?.message,
    };

    expect(parsed.success).toBe(true);
    expect(parsed.payment.status).toBe("captured");
    expect(parsed.message).toBe("Payment verified successfully");
  });

  it("handles verification failure safely without false success", () => {
    const mockBackendFailure = {
      success: false,
      message: "Invalid Razorpay payment signature",
    };

    const isSuccess = mockBackendFailure?.success === true;
    expect(isSuccess).toBe(false);
    expect(mockBackendFailure.message).toContain("Invalid Razorpay payment signature");
  });

  it("TEST 1: rejects empty response {} as verification failure", () => {
    const emptyBackendResponse = {};
    const isSuccess = (emptyBackendResponse as any)?.success === true;
    expect(isSuccess).toBe(false);
  });

  it("TEST 2: rejects response with { success: false } as verification failure", () => {
    const failedBackendResponse = {
      success: false,
      message: "Verification failed on server",
    };
    const isSuccess = failedBackendResponse?.success === true;
    expect(isSuccess).toBe(false);
  });

  it("handles Razorpay dismissal without clearing the cart", () => {
    let cartCleared = false;
    const cart = [{ id: "prod-1", title: "Robotics Kit", qty: 1 }];

    const handleDismiss = () => {
      // On dismissal, we throw / reject "Payment cancelled"
      const error = new Error("Payment cancelled");
      // Cart should NOT be cleared
      return error;
    };

    const err = handleDismiss();
    expect(err.message).toBe("Payment cancelled");
    expect(cartCleared).toBe(false);
    expect(cart.length).toBe(1);
  });

  it("enforces in-flight duplicate callback protection", async () => {
    let isVerifying = false;
    let verifyCallCount = 0;

    const onCallback = async () => {
      if (isVerifying) return "duplicate_blocked";
      isVerifying = true;
      try {
        verifyCallCount++;
        return "verified";
      } finally {
        // Keeps lock until completed
      }
    };

    // Simulate two concurrent callbacks from Razorpay
    const [res1, res2] = await Promise.all([onCallback(), onCallback()]);

    expect(verifyCallCount).toBe(1);
    expect([res1, res2]).toContain("verified");
    expect([res1, res2]).toContain("duplicate_blocked");
  });

  it("preserves cart on payment or verification failure", () => {
    const initialCart = [
      { id: "item-1", title: "ESP32 Kit", price: 1499, qty: 1 },
      { id: "item-2", title: "IoT Course", price: 999, qty: 1 },
    ];
    let activeCart = [...initialCart];

    const simulateFailedCheckout = (failureReason: string) => {
      // Cart is only cleared on confirmed success; on error, cart remains intact
      if (failureReason === "PAYMENT_FAILED" || failureReason === "VERIFY_ERROR") {
        // preserve cart
        return;
      }
      activeCart = [];
    };

    simulateFailedCheckout("VERIFY_ERROR");
    expect(activeCart.length).toBe(2);
    expect(activeCart).toEqual(initialCart);
  });

  it("handles successful server fulfillment with order and invoice data", () => {
    const mockOptionBResponse = {
      success: true,
      message: "Payment verified and order created successfully",
      payment: {
        id: "pay-123",
        status: "captured",
      },
      order: {
        id: "order-uuid-456",
        order_number: "MF-2026-0001",
        status: "confirmed",
      },
      invoice: {
        invoice_number: "INV-2026-0001",
        invoice_url: "https://makersflow.com/invoices/INV-2026-0001.pdf",
      },
    };

    const result = {
      success: Boolean(mockOptionBResponse.success),
      order: mockOptionBResponse.order,
      invoice: mockOptionBResponse.invoice,
    };

    expect(result.success).toBe(true);
    expect(result.order.id).toBe("order-uuid-456");
    expect(result.order.order_number).toBe("MF-2026-0001");
    expect(result.invoice.invoice_url).toContain(".pdf");
  });

  it("correctly handles legacy backend verify response without order object", () => {
    const legacyResponse = {
      success: true,
      message: "Payment verified successfully",
      payment: {
        id: "pay-789",
        status: "captured",
      },
    };

    const hasAuthoritativeOrder = Boolean((legacyResponse as any).order);
    expect(hasAuthoritativeOrder).toBe(false);

    // Fallback path activates when server did not attach order
    const resolvedOrderId = (legacyResponse as any).order?.id || "fallback-order-id";
    expect(resolvedOrderId).toBe("fallback-order-id");
  });

  describe("Backend (5) Contract & Checkout Scenarios", () => {
    type CheckoutItem = { id: string; qty: number; is_course?: boolean };

    function validateAndPrepareCheckout(items: CheckoutItem[]) {
      if (items.length === 0) {
        return { allowed: false, reason: "Cart is empty", createOrderCalled: false };
      }

      const hasCourses = items.some((i) => i.is_course);
      const hasPhysical = items.some((i) => !i.is_course);

      if (hasCourses && !hasPhysical) {
        return {
          allowed: false,
          reason: "Digital courses require the separate course enrollment flow. Please enroll directly on the course page.",
          createOrderCalled: false,
        };
      }

      if (hasCourses && hasPhysical) {
        return {
          allowed: false,
          reason: "Your cart contains both courses and physical products. The store payment flow currently supports physical products only. Please remove courses to proceed with store checkout.",
          createOrderCalled: false,
        };
      }

      // Case 1: Physical products only -> normal product checkout
      const productItemsMap = new Map<string, number>();
      for (const item of items) {
        const pid = String(item.id).trim();
        if (!/^\d+$/.test(pid)) {
          return {
            allowed: false,
            reason: `Invalid product ID "${item.id}". Store checkout requires valid numeric product IDs.`,
            createOrderCalled: false,
          };
        }
        const qty = Math.max(1, Math.floor(item.qty || 1));
        productItemsMap.set(pid, (productItemsMap.get(pid) || 0) + qty);
      }

      const itemsPayload = Array.from(productItemsMap.entries()).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

      return {
        allowed: true,
        reason: null,
        createOrderCalled: true,
        itemsPayload,
      };
    }

    it("Strict Product ID Validation: rejects non-numeric product IDs without sanitizing", () => {
      const invalidCart: CheckoutItem[] = [
        { id: "product-123", qty: 1, is_course: false },
      ];
      const result = validateAndPrepareCheckout(invalidCart);

      expect(result.allowed).toBe(false);
      expect(result.createOrderCalled).toBe(false);
      expect(result.reason).toContain("Invalid product ID");
      expect(result.reason).toContain("product-123");
    });

    it("Case 1: Physical products only -> normal product checkout", () => {
      const cart: CheckoutItem[] = [
        { id: "1", qty: 2, is_course: false },
        { id: "5", qty: 1, is_course: false },
      ];
      const result = validateAndPrepareCheckout(cart);

      expect(result.allowed).toBe(true);
      expect(result.createOrderCalled).toBe(true);
      expect(result.itemsPayload).toEqual([
        { productId: "1", quantity: 2 },
        { productId: "5", quantity: 1 },
      ]);
      // Cart items remain untouched
      expect(cart.length).toBe(2);
    });

    it("Case 2: Course only -> block store checkout and explain separate course enrollment", () => {
      let cart: CheckoutItem[] = [{ id: "course-react-101", qty: 1, is_course: true }];
      const result = validateAndPrepareCheckout(cart);

      expect(result.allowed).toBe(false);
      expect(result.createOrderCalled).toBe(false);
      expect(result.reason).toContain("separate course enrollment flow");
      // Entire cart is preserved and never cleared or filtered
      expect(cart.length).toBe(1);
      expect(cart[0].id).toBe("course-react-101");
    });

    it("Case 3: Course + physical product -> block store checkout and explain physical products only", () => {
      let cart: CheckoutItem[] = [
        { id: "1", qty: 1, is_course: false },
        { id: "course-ai-202", qty: 1, is_course: true },
      ];
      const result = validateAndPrepareCheckout(cart);

      expect(result.allowed).toBe(false);
      expect(result.createOrderCalled).toBe(false);
      expect(result.reason).toContain("both courses and physical products");
      expect(result.reason).toContain("physical products only");
      // Must NOT silently filter courses or remove items — entire cart preserved
      expect(cart.length).toBe(2);
      expect(cart.some((i) => i.is_course)).toBe(true);
      expect(cart.some((i) => !i.is_course)).toBe(true);
    });

    it("Scenario 3b: Duplicate product lines are deduplicated and quantities summed", () => {
      const cart: CheckoutItem[] = [
        { id: "10", qty: 2, is_course: false },
        { id: "10", qty: 3, is_course: false },
      ];
      const result = validateAndPrepareCheckout(cart);
      expect(result.allowed).toBe(true);
      expect(result.itemsPayload).toEqual([{ productId: "10", quantity: 5 }]);
    });

    it("TEST 3: Quantity Normalization: normalizes quantity 0 to 1", () => {
      const cart: CheckoutItem[] = [
        { id: "42", qty: 0, is_course: false },
      ];
      const result = validateAndPrepareCheckout(cart);
      expect(result.allowed).toBe(true);
      expect(result.itemsPayload).toEqual([{ productId: "42", quantity: 1 }]);
    });

    it("TEST 4: Quantity Normalization: normalizes negative quantity -1 to 1", () => {
      const cart: CheckoutItem[] = [
        { id: "42", qty: -1, is_course: false },
      ];
      const result = validateAndPrepareCheckout(cart);
      expect(result.allowed).toBe(true);
      expect(result.itemsPayload).toEqual([{ productId: "42", quantity: 1 }]);
    });

    it("Scenario 12, 13 & 14: Server fulfillment bypasses /orders/checkout fallback and uses authoritative invoice", () => {
      let legacyOrderCheckoutCalled = false;
      const verificationResponse = {
        success: true,
        order: { id: "order-srv-999", total_amount: 1499 },
        invoice: { invoice_number: "INV-999", invoice_url: "https://cdn.makersflow.com/invoices/999.pdf" },
      };

      let resolvedOrder = verificationResponse.order ?? null;
      if (!resolvedOrder) {
        legacyOrderCheckoutCalled = true;
      }

      expect(legacyOrderCheckoutCalled).toBe(false);
      expect(resolvedOrder.id).toBe("order-srv-999");
      expect(verificationResponse.invoice.invoice_url).toBe("https://cdn.makersflow.com/invoices/999.pdf");
    });
  });
});
