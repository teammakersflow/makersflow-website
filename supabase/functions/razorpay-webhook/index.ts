/**
 * razorpay-webhook — Supabase Edge Function
 *
 * Handles Razorpay webhook events:
 * - payment.captured  → update payment, create course_purchases, order_items, reduce stock, generate invoice
 * - payment.failed    → update payment status to failed
 * - refund.created    → update refund status to processing
 * - refund.processed  → update refund status to completed, revoke course access if needed
 *
 * Set this URL in Razorpay Dashboard → Settings → Webhooks:
 * https://oodqutwsljhvuyotuthu.supabase.co/functions/v1/razorpay-webhook
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// crypto is available globally in Supabase edge functions — no import needed

const RAZORPAY_WEBHOOK_SECRET = (Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "").trim();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

async function verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
  if (!RAZORPAY_WEBHOOK_SECRET) return true;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(RAZORPAY_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const valid = await verifyWebhookSignature(rawBody, signature);
  if (!valid) return new Response("Invalid signature", { status: 401 });

  let event: { event: string; payload: Record<string, unknown> };
  try { event = JSON.parse(rawBody); } catch { return new Response("Bad JSON", { status: 400 }); }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const eventName = event.event;

  // ── Idempotency: Razorpay retries deliveries; dedupe on the event id so
  //    order_items / invoices / coupon_usage are never double-inserted.
  const eventId = req.headers.get("x-razorpay-event-id")
    ?? `${eventName}:${(event as Record<string, unknown>).created_at ?? rawBody.length}`;
  const { error: dedupeErr } = await admin
    .from("payment_events")
    .insert({ event_id: eventId, event_type: eventName, payload: event });
  if (dedupeErr) {
    if (dedupeErr.code === "23505") {
      return new Response(JSON.stringify({ status: "duplicate_ignored" }), { status: 200 });
    }
    // payment_events table missing → log and continue (degrades gracefully)
    console.warn("[razorpay-webhook] dedupe unavailable:", dedupeErr.message);
  }

  // ── payment.captured ──────────────────────────────────────────────────────
  if (eventName === "payment.captured") {
    const paymentEntity = (event.payload?.payment as { entity?: Record<string, unknown> })?.entity ?? {};
    const razorpayPaymentId = paymentEntity.id as string;
    const razorpayOrderId = paymentEntity.order_id as string;

    // 1. Update payment record to captured
    await admin.from("payments")
      .update({ status: "captured" })
      .eq("razorpay_payment_id", razorpayPaymentId);

    // 2. Find our internal payment record (which holds user_id and order items context)
    const { data: paymentRecord } = await admin.from("payments")
      .select("*").eq("razorpay_payment_id", razorpayPaymentId).maybeSingle();

    if (paymentRecord) {
      const userId = paymentRecord.user_id;

      // 3. Find the related order to get items
      const { data: order } = await admin.from("orders")
        .select("*")
        .eq("razorpay_order_id", razorpayOrderId)
        .eq("user_id", userId)
        .maybeSingle();

      if (order) {
        const items: Array<{
          id: string; title: string; price: number; qty: number;
          is_course: boolean; course_id?: string; gst_rate?: number;
        }> = Array.isArray(order.items) ? order.items : [];

        // 4. Create normalized order_items rows
        if (items.length > 0) {
          await admin.from("order_items").insert(
            items.map(item => ({
              order_id: order.id,
              product_id: !item.is_course ? item.id : null,
              course_id: item.is_course ? (item.course_id ?? item.id) : null,
              title: item.title,
              price: item.price,
              quantity: item.qty ?? 1,
              gst_rate: item.gst_rate ?? 18,
              item_type: item.is_course ? "course" : "product",
            }))
          );
        }

        // 5. Grant course access — create course_purchase records
        const courseItems = items.filter(i => i.is_course);
        if (courseItems.length > 0) {
          await admin.from("course_purchases").upsert(
            courseItems.map(item => ({
              user_id: userId,
              course_id: item.course_id ?? item.id,
              order_id: order.id,
              payment_id: paymentRecord.id,
              razorpay_payment_id: razorpayPaymentId,
              amount_paid: item.price,
              status: "active",
            })),
            { onConflict: "user_id,course_id" }
          );

          // 5b. Mirror access into `enrollments` — the table the mobile app
          //     and web My Learning read — with the shared 1-year window.
          const enrolledAt = new Date();
          const expiresAt = new Date(enrolledAt.getTime() + 365 * 24 * 60 * 60 * 1000);
          await admin.from("enrollments").upsert(
            courseItems.map(item => ({
              user_id: userId,
              course_id: item.course_id ?? item.id,
              payment_status: "completed",
              status: "active",
              enrolled_at: enrolledAt.toISOString(),
              expires_at: expiresAt.toISOString(),
            })),
            { onConflict: "user_id,course_id" }
          );
        }

        // 6. Reduce stock for physical products
        const productItems = items.filter(i => !i.is_course);
        for (const item of productItems) {
          await admin.rpc("decrement_product_stock", {
            product_id_param: item.id,
            qty_param: item.qty ?? 1,
          });
        }

        // 7. Update order status to paid
        await admin.from("orders")
          .update({ status: "paid" })
          .eq("id", order.id);
      }

      // 8. Save coupon usage if a coupon was used
      if (paymentRecord.coupon_code) {
        const { data: coupon } = await admin.from("coupons")
          .select("id").eq("code", paymentRecord.coupon_code).maybeSingle();
        if (coupon) {
          // verify-razorpay-payment already records usage synchronously when
          // the client passes coupon_id — only record here if that didn't
          // happen (e.g. client crashed), so counts aren't doubled.
          const { count: existing } = await admin.from("coupon_usage")
            .select("id", { count: "exact", head: true })
            .eq("coupon_id", coupon.id)
            .eq("user_id", userId);
          if ((existing ?? 0) === 0) {
            await admin.from("coupon_usage").insert({
              coupon_id: coupon.id,
              user_id: userId,
              discount_amount: paymentRecord.discount_amount,
            });
            await admin.rpc("increment_coupon_usage", { coupon_id_param: coupon.id });
          }
        }
      }

      // 9. Generate invoice
      const invoiceNumber = `INV-${Date.now()}-${razorpayPaymentId.slice(-6).toUpperCase()}`;
      await admin.from("invoices").insert({
        order_id: order?.id ?? null,
        payment_id: paymentRecord.id,
        user_id: userId,
        invoice_number: invoiceNumber,
        total_amount: paymentRecord.amount,
        tax_amount: paymentRecord.tax_amount,
        discount_amount: paymentRecord.discount_amount,
        status: "issued",
        invoice_data: {
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          coupon_code: paymentRecord.coupon_code,
        },
      });
    }
  }

  // ── payment.failed ────────────────────────────────────────────────────────
  if (eventName === "payment.failed") {
    const paymentEntity = (event.payload?.payment as { entity?: Record<string, unknown> })?.entity ?? {};
    const errorCode   = (paymentEntity.error_code as string)   ?? null;
    const errorDesc   = (paymentEntity.error_description as string) ?? null;
    const errorReason = (paymentEntity.error_reason as string)  ?? null;
    await admin.from("payments")
      .update({
        status: "failed",
        failure_code: errorCode,
        failure_reason: errorReason,
        failure_description: errorDesc,
      })
      .eq("razorpay_order_id", paymentEntity.order_id as string);
    // Also update linked order to failed
    await admin.from("orders")
      .update({ status: "payment_failed" })
      .eq("razorpay_order_id", paymentEntity.order_id as string);
  }

  // ── refund.created ────────────────────────────────────────────────────────
  if (eventName === "refund.created") {
    const refundEntity = (event.payload?.refund as { entity?: Record<string, unknown> })?.entity ?? {};
    await admin.from("refunds")
      .update({ status: "processing", razorpay_refund_id: refundEntity.id as string })
      .eq("razorpay_payment_id", refundEntity.payment_id as string)
      .eq("status", "pending");
  }

  // ── refund.processed ─────────────────────────────────────────────────────
  if (eventName === "refund.processed" || eventName === "refund.speed_changed") {
    const refundEntity = (event.payload?.refund as { entity?: Record<string, unknown> })?.entity ?? {};
    const rzpPaymentId = refundEntity.payment_id as string;

    await admin.from("refunds")
      .update({ status: "completed", razorpay_refund_id: refundEntity.id as string })
      .eq("razorpay_payment_id", rzpPaymentId);

    // Update payment status
    await admin.from("payments")
      .update({ status: "refunded" })
      .eq("razorpay_payment_id", rzpPaymentId);

    // Revoke course access for any course_purchases linked to this payment
    await admin.from("course_purchases")
      .update({ status: "refunded" })
      .eq("razorpay_payment_id", rzpPaymentId);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
