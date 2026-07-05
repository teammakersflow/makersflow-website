/**
 * create-razorpay-order — Supabase Edge Function
 * Creates a Razorpay order using the pre-calculated total from frontend.
 * The total is already validated (coupon via validate-coupon, GST, shipping).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID       = (Deno.env.get("RAZORPAY_KEY_ID")     ?? "").trim();
const RAZORPAY_KEY_SECRET   = (Deno.env.get("RAZORPAY_KEY_SECRET") ?? "").trim();
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")          ?? "";
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SHIPPING_FEE          = 49;
const FREE_SHIPPING         = 999;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("[create-razorpay-order] Missing Razorpay keys");
      return jsonError("Payment configuration error", 500);
    }

    const body = await req.json() as {
      items?: Array<{ id: string; qty: number; is_course?: boolean; price?: number }>;
      total_amount?: number;
      include_shipping?: boolean;
      currency?: string;
      receipt?: string;
      notes?: Record<string, string | number>;
    };

    const lineItems = body.items ?? [];
    if (lineItems.length === 0) return jsonError("No items in cart", 400);

    console.log(`[create-razorpay-order] KEY_ID: ${RAZORPAY_KEY_ID} | SECRET_LEN: ${RAZORPAY_KEY_SECRET.length}`);

    let totalPaise: number;

    // ── Strategy 1: Use pre-calculated total from frontend ─────────────────
    if (body.total_amount && body.total_amount > 0) {
      totalPaise = Math.round(body.total_amount * 100);
      console.log(`[create-razorpay-order] Using frontend total: ₹${body.total_amount} → ${totalPaise} paise`);

    } else {
      // ── Strategy 2: Look up prices from DB + use item.price as fallback ──
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
      const productIds = lineItems.filter(i => !i.is_course).map(i => i.id);
      const courseIds  = lineItems.filter(i =>  i.is_course).map(i => i.id);

      const [pRes, cRes] = await Promise.all([
        productIds.length > 0
          ? supabase.from("products").select("id, price").in("id", productIds)
          : { data: [], error: null },
        courseIds.length > 0
          ? supabase.from("courses").select("id, price").in("id", courseIds)
          : { data: [], error: null },
      ]);

      const priceMap = new Map<string, number>();
      for (const row of [...(pRes.data ?? []), ...(cRes.data ?? [])]) {
        priceMap.set(row.id, row.price);
      }

      let subtotal = 0;
      for (const item of lineItems) {
        const price = priceMap.get(item.id) ?? item.price ?? 0;
        subtotal += price * (item.qty ?? 1);
      }

      const shipping = body.include_shipping && subtotal < FREE_SHIPPING ? SHIPPING_FEE : 0;
      totalPaise = Math.round((subtotal + shipping) * 100);
      console.log(`[create-razorpay-order] Computed: ₹${subtotal}+₹${shipping} → ${totalPaise} paise`);
    }

    if (totalPaise <= 0) return jsonError("Order amount is zero", 422);

    // ── Create Razorpay order ───────────────────────────────────────────────
    const basicAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount:   totalPaise,
        currency: body.currency ?? "INR",
        receipt:  body.receipt  ?? `order_${Date.now()}`,
        notes:    body.notes    ?? {},
      }),
    });

    const rzpText = await rzpRes.text();
    if (!rzpRes.ok) {
      console.error(`[create-razorpay-order] Razorpay ${rzpRes.status}:`, rzpText);
      return jsonError(`Payment gateway error: ${rzpRes.status}`, 500);
    }

    const order = JSON.parse(rzpText);
    return new Response(JSON.stringify({ ...order, key_id: RAZORPAY_KEY_ID }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[create-razorpay-order] Error:", msg);
    return jsonError(msg, 500);
  }
});
