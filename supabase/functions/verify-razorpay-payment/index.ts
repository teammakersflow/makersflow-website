/**
 * verify-razorpay-payment — Supabase Edge Function
 *
 * Verifies Razorpay payment signature using HMAC-SHA256.
 * Called from checkout after payment completes.
 *
 * Request body:
 * {
 *   razorpay_payment_id: string,
 *   razorpay_order_id: string,
 *   razorpay_signature: string,
 *   user_id?: string,
 *   amount?: number,
 *   coupon_code?: string,
 *   discount_amount?: number,
 *   tax_amount?: number,
 *   coupon_id?: string
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// crypto is available globally in Supabase edge functions — no import needed

const RAZORPAY_KEY_SECRET = (Deno.env.get("RAZORPAY_KEY_SECRET") ?? "").trim();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      user_id,
      amount = 0,
      coupon_code,
      discount_amount = 0,
      tax_amount = 0,
      coupon_id,
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return json({ verified: false, error: "Missing payment fields" }, 400);
    }

    // Verify HMAC-SHA256 signature
    const expected = await hmacSha256(
      RAZORPAY_KEY_SECRET,
      `${razorpay_order_id}|${razorpay_payment_id}`
    );

    if (expected !== razorpay_signature) {
      return json({ verified: false, error: "Signature mismatch" }, 400);
    }

    // Save payment record
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (user_id) {
      const { data: payment } = await admin
        .from("payments")
        .insert({
          user_id,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          amount,
          status: "captured",
          coupon_code: coupon_code || null,
          discount_amount,
          tax_amount,
        })
        .select("id")
        .single();

      // Record coupon usage if a coupon was applied
      if (coupon_id && coupon_code) {
        await admin.from("coupon_usage").insert({
          coupon_id,
          user_id,
          discount_amount,
        });
        // Increment coupon used_count
        await admin.rpc("increment_coupon_usage", { coupon_id_param: coupon_id });
      }

      return json({ verified: true, payment_id: payment?.id });
    }

    return json({ verified: true });
  } catch (err) {
    return json(
      { verified: false, error: err instanceof Error ? err.message : "Server error" },
      500
    );
  }
});
