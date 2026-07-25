import { createClient } from "@supabase/supabase-js";

// Production Project Ref Safeguard — WILL HARD-FAIL if staging URL points to Production
const PROD_PROJECT_REF = "oodqutwsljhvuyotuthu";
const PROD_URL = "https://oodqutwsljhvuyotuthu.supabase.co";

const STAGING_URL = process.env.SUPABASE_STAGING_URL;
const STAGING_ANON_KEY = process.env.SUPABASE_STAGING_ANON_KEY;

if (!STAGING_URL || !STAGING_ANON_KEY) {
  console.error(
    "❌ ERROR: SUPABASE_STAGING_URL and SUPABASE_STAGING_ANON_KEY environment variables are required.",
  );
  console.error("Please set them before running this script.");
  process.exit(1);
}

if (STAGING_URL.includes(PROD_PROJECT_REF) || STAGING_URL === PROD_URL) {
  console.error(
    "❌ CRITICAL ERROR: Staging URL matches the Production Project Ref (oodqutwsljhvuyotuthu)!",
  );
  console.error("Execution aborted to protect production.");
  process.exit(1);
}

const anonClient = createClient(STAGING_URL, STAGING_ANON_KEY);

async function runStagingSuite() {
  console.log("=================================================================");
  console.log(" MAKERSFLOW STAGING RLS SECURITY TEST SUITE");
  console.log(` Target Staging URL: ${STAGING_URL}`);
  console.log("=================================================================\n");

  // 1. Query REAL Existing Row IDs on Staging
  const { data: payRow } = await anonClient.from("payments").select("id").limit(1).maybeSingle();
  const { data: itemRow } = await anonClient
    .from("order_items")
    .select("id")
    .limit(1)
    .maybeSingle();
  const { data: coupRow } = await anonClient.from("coupons").select("id").limit(1).maybeSingle();
  const { data: setRow } = await anonClient.from("settings").select("key").limit(1).maybeSingle();

  const realPaymentId = payRow?.id ?? null;
  const realOrderItemId = itemRow?.id ?? null;
  const realCouponId = coupRow?.id ?? null;
  const realSettingKey = setRow?.key ?? null;

  console.log("--- STAGING TARGET ROW IDENTIFIERS ---");
  console.log({ realPaymentId, realOrderItemId, realCouponId, realSettingKey });

  // 2. Authenticate Staging Non-Admin User Session
  const testEmail = `test_staging_${Date.now()}@example.com`;
  const testPassword = "StagingTestPassword123!";

  const { data: authData, error: signUpErr } = await anonClient.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpErr || !authData.session) {
    console.error("Could not establish staging non-admin session:", signUpErr?.message);
    process.exit(1);
  }

  const authClient = createClient(STAGING_URL, STAGING_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${authData.session.access_token}` },
    },
  });

  console.log(`✓ Staging Non-Admin User Authenticated (ID: ${authData.user.id})\n`);

  // 3. Negative Tests (Non-Admin Write Attempts)
  console.log("--- STAGING NEGATIVE TESTS (AUTHENTICATED NON-ADMIN WRITES) ---");

  // A. Settings UPDATE
  if (realSettingKey) {
    const { data: sData, error: sErr } = await authClient
      .from("settings")
      .update({ value: "999" })
      .eq("key", realSettingKey)
      .select();
    console.log("A. Settings UPDATE:", {
      targetKey: realSettingKey,
      rowsUpdated: sData?.length ?? 0,
      errorCode: sErr?.code ?? (sData?.length === 0 ? "RLS_FILTERED_ZERO_ROWS" : "ALLOWED_200"),
      errorMessage: sErr?.message ?? "Allowed",
    });
  } else {
    console.log("A. Settings UPDATE: No existing row found to target.");
  }

  // B. Coupons UPDATE
  if (realCouponId) {
    const { data: cData, error: cErr } = await authClient
      .from("coupons")
      .update({ is_active: false })
      .eq("id", realCouponId)
      .select();
    console.log("B. Coupons UPDATE:", {
      targetId: realCouponId,
      rowsUpdated: cData?.length ?? 0,
      errorCode: cErr?.code ?? (cData?.length === 0 ? "RLS_FILTERED_ZERO_ROWS" : "ALLOWED_200"),
      errorMessage: cErr?.message ?? "Allowed",
    });
  } else {
    console.log("B. Coupons UPDATE: No existing row found to target.");
  }

  // C. Payments UPDATE
  if (realPaymentId) {
    const { data: pData, error: pErr } = await authClient
      .from("payments")
      .update({ amount: 0 })
      .eq("id", realPaymentId)
      .select();
    console.log("C. Payments UPDATE:", {
      targetId: realPaymentId,
      rowsUpdated: pData?.length ?? 0,
      errorCode: pErr?.code ?? (pData?.length === 0 ? "RLS_FILTERED_ZERO_ROWS" : "ALLOWED_200"),
      errorMessage: pErr?.message ?? "Allowed",
    });
  } else {
    console.log("C. Payments UPDATE: No existing row found to target.");
  }

  // D. Order Items UPDATE
  if (realOrderItemId) {
    const { data: iData, error: iErr } = await authClient
      .from("order_items")
      .update({ quantity: 2 })
      .eq("id", realOrderItemId)
      .select();
    console.log("D. Order Items UPDATE:", {
      targetId: realOrderItemId,
      rowsUpdated: iData?.length ?? 0,
      errorCode: iErr?.code ?? (iData?.length === 0 ? "RLS_FILTERED_ZERO_ROWS" : "ALLOWED_200"),
      errorMessage: iErr?.message ?? "Allowed",
    });
  } else {
    console.log("D. Order Items UPDATE: No existing row found to target.");
  }

  // 4. Positive Tests (Anonymous Reads)
  console.log("\n--- STAGING POSITIVE TESTS (ANONYMOUS READS) ---");
  const { data: rData, error: rErr } = await anonClient.from("reviews").select("id").limit(3);
  console.log("A. Reviews SELECT:", {
    count: rData?.length ?? 0,
    errorCode: rErr?.code ?? "200_OK",
    errorMessage: rErr?.message ?? "None",
  });

  const { data: prData, error: prErr } = await anonClient.from("profiles").select("id").limit(3);
  console.log("B. Profiles SELECT:", {
    count: prData?.length ?? 0,
    errorCode: prErr?.code ?? "200_OK",
    errorMessage: prErr?.message ?? "None",
  });

  const { data: stData, error: stErr } = await anonClient.from("settings").select("key").limit(3);
  console.log("C. Settings SELECT:", {
    count: stData?.length ?? 0,
    errorCode: stErr?.code ?? "200_OK",
    errorMessage: stErr?.message ?? "None",
  });

  console.log("\n=================================================================");
  console.log(" STAGING TEST SUITE COMPLETE");
  console.log("=================================================================");
}

runStagingSuite().catch(console.error);
