import { createClient } from "@supabase/supabase-js";

const PROD_URL = "https://oodqutwsljhvuyotuthu.supabase.co";
const PROD_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZHF1dHdzbGpodnV5b3R1dGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mjk3MDYsImV4cCI6MjA5NzEwNTcwNn0.XgxUO7bUC24GFziKvZCawVgUKRjxC7OGzSdu1aN3xL0";

const client = createClient(PROD_URL, PROD_ANON_KEY);

async function runRawVerification() {
  const executionTimestamp = new Date().toISOString();
  console.log("=================================================================");
  console.log(` RAW PRODUCTION REVERT & VERIFICATION LOG`);
  console.log(` Execution Timestamp: ${executionTimestamp}`);
  console.log("=================================================================\n");

  // STEP 2: RAW UPDATE RESPONSE OUTPUT FOR REVERT
  console.log("--- STEP 2: RAW UPDATE RESPONSE OUTPUT ---");

  // A. Update Settings (passing explicit updated_at timestamp)
  const setUpdateStart = new Date().toISOString();
  const setUpdateRes = await client
    .from("settings")
    .update({ value: "149", updated_at: setUpdateStart })
    .eq("key", "shipping_fee_remote")
    .select();

  console.log("Settings UPDATE Raw Response:", {
    queryTime: setUpdateStart,
    rowsUpdated: setUpdateRes.data?.length ?? 0,
    error: setUpdateRes.error,
    data: setUpdateRes.data,
  });

  // B. Update Coupon
  const coupUpdateStart = new Date().toISOString();
  const coupUpdateRes = await client
    .from("coupons")
    .update({ is_active: true })
    .eq("id", "c3766496-6c3c-47ad-8bdc-29ade6b99afa")
    .select();

  console.log("\nCoupon UPDATE Raw Response:", {
    queryTime: coupUpdateStart,
    rowsUpdated: coupUpdateRes.data?.length ?? 0,
    error: coupUpdateRes.error,
    data: coupUpdateRes.data,
  });

  // STEP 3: FRESH PLAIN SELECT VERIFICATION WITH FRESH EXECUTION TIMESTAMP
  console.log("\n--- STEP 3: FRESH PLAIN SELECT VERIFICATION ---");
  const selectTimestamp = new Date().toISOString();
  console.log(`SELECT Executed At: ${selectTimestamp}\n`);

  // Plain SELECT settings
  const settingsSelect = await client
    .from("settings")
    .select("key, value, label, updated_at")
    .eq("key", "shipping_fee_remote");

  console.log("Settings SELECT Raw Response:", {
    queryTimestamp: selectTimestamp,
    error: settingsSelect.error,
    rows: settingsSelect.data,
  });

  // Plain SELECT coupons
  const couponsSelect = await client
    .from("coupons")
    .select("id, code, is_active, created_at")
    .eq("id", "c3766496-6c3c-47ad-8bdc-29ade6b99afa");

  console.log("\nCoupons SELECT Raw Response:", {
    queryTimestamp: selectTimestamp,
    error: couponsSelect.error,
    rows: couponsSelect.data,
  });

  console.log("\n=================================================================");
  console.log(" RAW VERIFICATION COMPLETE");
  console.log("=================================================================");
}

runRawVerification().catch(console.error);
