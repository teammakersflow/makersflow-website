/**
 * validate-coupon — Supabase Edge Function
 * Validates coupon code and returns discount amount.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const body = await req.json().catch(() => ({}));
    const code = (body.code ?? "").toString().trim().toUpperCase();
    const subtotal = Number(body.subtotal ?? 0);
    const item_ids = Array.isArray(body.item_ids) ? body.item_ids : [];
    const user_id = body.user_id ?? null;

    console.log("[validate-coupon] Request:", { code, subtotal, item_ids_count: item_ids.length });

    if (!code) return json({ valid: false, message: "Coupon code is required" });
    if (!subtotal) return json({ valid: false, message: "Cart subtotal is required" });

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[validate-coupon] Missing Supabase env vars");
      return json({ valid: false, message: "Server configuration error" }, 500);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Look up coupon (bypass RLS with service role) ──────────────────────
    const { data: coupon, error: dbErr } = await admin
      .from("coupons")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (dbErr) {
      console.error("[validate-coupon] DB error:", dbErr.message, dbErr.code);
      return json({ valid: false, message: "Could not validate coupon. Please try again." });
    }

    console.log("[validate-coupon] Lookup result:", coupon ? `found: ${coupon.code}` : "not found");

    if (!coupon) return json({ valid: false, message: "Invalid coupon code" });
    if (!coupon.is_active)
      return json({ valid: false, message: "This coupon is no longer active" });

    // ── Expiry check ────────────────────────────────────────────────────────
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return json({ valid: false, message: "This coupon has expired" });
    }

    // ── Usage limit check ───────────────────────────────────────────────────
    const usageLimit = Number(coupon.usage_limit ?? 0);
    if (usageLimit > 0 && Number(coupon.used_count ?? 0) >= usageLimit) {
      return json({ valid: false, message: "This coupon has reached its usage limit" });
    }

    // ── Minimum order check ─────────────────────────────────────────────────
    const minOrder = Number(coupon.min_order_amount ?? 0);
    if (minOrder > 0 && subtotal < minOrder) {
      return json({
        valid: false,
        message: `Minimum order of ₹${minOrder} required for this coupon`,
      });
    }

    // ── Applicable items check (only if restrictions set) ───────────────────
    const productRestrictions: string[] = coupon.applicable_product_ids ?? [];
    const courseRestrictions: string[] = coupon.applicable_course_ids ?? [];
    if (productRestrictions.length > 0 || courseRestrictions.length > 0) {
      const allowed = [...productRestrictions, ...courseRestrictions];
      const hasMatch = item_ids.some((id: string) => allowed.includes(id));
      if (!hasMatch) {
        return json({ valid: false, message: "This coupon is not valid for items in your cart" });
      }
    }

    // ── Per-user usage check ────────────────────────────────────────────────
    if (user_id) {
      const { count } = await admin
        .from("coupon_usage")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("user_id", user_id);
      if ((count ?? 0) > 0) {
        return json({ valid: false, message: "You have already used this coupon" });
      }
    }

    // ── Calculate discount ──────────────────────────────────────────────────
    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = Math.round((subtotal * Number(coupon.discount_value)) / 100);
      const maxDisc = Number(coupon.max_discount_amount ?? 0);
      if (maxDisc > 0) discount = Math.min(discount, maxDisc);
    } else {
      discount = Math.min(Number(coupon.discount_value), subtotal);
    }
    discount = Math.max(0, discount);

    const label =
      coupon.discount_type === "percentage"
        ? `${coupon.discount_value}% off`
        : `₹${coupon.discount_value} off`;

    console.log("[validate-coupon] Valid! discount:", discount, "label:", label);

    return json({
      valid: true,
      discount,
      label,
      coupon_id: coupon.id,
      description: coupon.description ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[validate-coupon] Uncaught:", msg);
    return json({ valid: false, message: "Server error. Please try again." }, 500);
  }
});
