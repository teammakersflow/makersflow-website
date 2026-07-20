import { createClient } from "@supabase/supabase-js";

const PROD_URL = "https://oodqutwsljhvuyotuthu.supabase.co";
const PROD_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZHF1dHdzbGpodnV5b3R1dGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mjk3MDYsImV4cCI6MjA5NzEwNTcwNn0.XgxUO7bUC24GFziKvZCawVgUKRjxC7OGzSdu1aN3xL0";

const client = createClient(PROD_URL, PROD_ANON_KEY);

async function verifyAuthCleanup() {
  const executionTimestamp = new Date().toISOString();
  console.log("=================================================================");
  console.log(` AUTH CLEANUP VERIFICATION LOG`);
  console.log(` Execution Timestamp: ${executionTimestamp}`);
  console.log("=================================================================\n");

  // List of all test emails generated during earlier test runs
  const testEmails = [
    "test_non_admin_1784533000000@example.com",
    "test_non_admin_1784533030000@example.com",
    "test_non_admin_1784533050000@example.com",
    "test_staging_1784533500000@example.com",
  ];

  console.log("Attempting sign-in verification for generated test accounts:");

  for (const email of testEmails) {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: "TestPassword123!",
    });

    console.log(`Email: ${email} ->`, {
      sessionCreated: !!data.session,
      errorCode: error?.code ?? "SUCCESS_EXISTS",
      errorMessage: error?.message ?? "User session created",
    });
  }

  // Also check profiles table for any residual test_non_admin rows
  const { data: profRows, error: profErr } = await client
    .from("profiles")
    .select("id, full_name, role")
    .ilike("full_name", "%test%");

  console.log("\nProfiles Table Residual Test Search ('%test%'):", {
    residualCount: profRows?.length ?? 0,
    rows: profRows,
    error: profErr,
  });

  console.log("\n=================================================================");
  console.log(" AUTH CLEANUP VERIFICATION COMPLETE");
  console.log("=================================================================");
}

verifyAuthCleanup().catch(console.error);
