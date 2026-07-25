import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oodqutwsljhvuyotuthu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZHF1dHdzbGpodnV5b3R1dGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mjk3MDYsImV4cCI6MjA5NzEwNTcwNn0.XgxUO7bUC24GFziKvZCawVgUKRjxC7OGzSdu1aN3xL0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanupUser(email, password) {
  try {
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr || !data.session) {
      console.log(`Could not sign in ${email}:`, signInErr?.message);
      return;
    }
    const token = data.session.access_token;
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: res, error: delErr } = await userClient.functions.invoke("delete-account");
    console.log(`Cleanup user ${email} (${data.user.id}):`, res ?? delErr?.message);
  } catch (err) {
    console.error(`Error cleaning up user ${email}:`, err);
  }
}

async function runCleanup() {
  console.log("=== CLEANING UP PRODUCTION TEST USERS ===");
  // Cleanup test users created during test runs
  const usersToClean = [
    // If any emails were used, clean them here
  ];
  for (const u of usersToClean) {
    await cleanupUser(u.email, u.password);
  }
}

runCleanup().catch(console.error);
