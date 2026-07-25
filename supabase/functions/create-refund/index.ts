/**
 * create-refund — Supabase Edge Function
 *
 * Called from admin panel to initiate a refund via Razorpay API.
 *
 * Request body:
 * {
 *   payment_id: string,            // our internal payments.id
 *   razorpay_payment_id: string,   // rzp payment id
 *   amount?: number,               // partial refund amount (₹); null = full refund
 *   reason?: string,               // reason for refund
 *   user_id: string
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID = (Deno.env.get("RAZORPAY_KEY_ID") ?? "").trim();
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { payment_id, razorpay_payment_id, amount, reason, user_id } = await req.json();
    if (!razorpay_payment_id || !user_id) return json({ error: "Missing required fields" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch original payment to validate amount
    const { data: payment } = await admin
      .from("payments")
      .select("*")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();

    if (!payment) return json({ error: "Payment not found" }, 404);
    if (payment.status === "refunded") return json({ error: "Payment already refunded" }, 400);

    const refundAmount = amount ?? payment.amount; // paise for Razorpay
    const refundAmountPaise = Math.round(refundAmount * 100);

    // Call Razorpay refund API
    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const rzpRes = await fetch(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          amount: refundAmountPaise,
          speed: "normal",
          notes: { reason: reason ?? "Admin initiated refund" },
        }),
      },
    );

    const rzpData = await rzpRes.json();
    if (!rzpRes.ok)
      return json({ error: rzpData.error?.description ?? "Razorpay refund failed" }, 400);

    // Save refund record
    const { data: refundRecord } = await admin
      .from("refunds")
      .insert({
        payment_id,
        user_id,
        razorpay_payment_id,
        razorpay_refund_id: rzpData.id,
        amount: refundAmount,
        reason: reason ?? null,
        status: "processing",
        initiated_by: "admin",
      })
      .select("id")
      .single();

    // Revoke course access if this payment was for courses
    // (business policy: revoke on refund — can be changed to keep access)
    await admin
      .from("course_purchases")
      .update({ status: "revoked" })
      .eq("razorpay_payment_id", razorpay_payment_id);

    return json({ success: true, refund_id: refundRecord?.id, razorpay_refund_id: rzpData.id });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});
