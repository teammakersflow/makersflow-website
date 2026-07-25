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
