import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oodqutwsljhvuyotuthu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZHF1dHdzbGpodnV5b3R1dGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mjk3MDYsImV4cCI6MjA5NzEwNTcwNn0.XgxUO7bUC24GFziKvZCawVgUKRjxC7OGzSdu1aN3xL0";

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function remediateProduction() {
  console.log("=== REMEDIATING PRODUCTION DATABASE ===");

  // 1. Revert settings: shipping_fee_remote -> '149'
  const { data: setRes, error: setErr } = await client
    .from("settings")
    .update({ value: "149" })
    .eq("key", "shipping_fee_remote")
    .select();

  console.log("1. Revert settings result:", {
    updated: setRes,
    error: setErr?.message ?? null,
  });

  // 2. Revert coupons: TEST50 -> is_active = true
  const { data: coupRes, error: coupErr } = await client
    .from("coupons")
    .update({ is_active: true })
    .eq("id", "c3766496-6c3c-47ad-8bdc-29ade6b99afa")
    .select();

  console.log("2. Revert coupons result:", {
    updated: coupRes,
    error: coupErr?.message ?? null,
  });

  // 3. Verify settings state
  const { data: currentSettings } = await client
    .from("settings")
    .select("*")
    .eq("key", "shipping_fee_remote");

  console.log("3. Current settings state:", currentSettings);

  // 4. Verify coupon state
  const { data: currentCoupon } = await client
    .from("coupons")
    .select("*")
    .eq("id", "c3766496-6c3c-47ad-8bdc-29ade6b99afa");

  console.log("4. Current coupon state:", currentCoupon);
}

remediateProduction().catch(console.error);
