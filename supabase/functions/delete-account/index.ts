/**
 * delete-account — Supabase Edge Function
 *
 * Verifies the caller's JWT, deletes all their data from every table,
 * then removes the auth user record using the service-role key.
 *
 * Called from the web app's 3-dots → Account Deletion flow.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // 1. Verify the caller is a real, authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // 2. Use service-role client to delete all user data + auth record
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Delete user-owned rows from every relevant table
    // (order matters for FK constraints — children before parents)
    const tables: Array<{ table: string; column: string }> = [
      { table: "lesson_progress",  column: "user_id" },
      { table: "quiz_attempts",    column: "user_id" },
      { table: "enrollments",      column: "user_id" },
      { table: "order_items",      column: "user_id" },
      { table: "orders",           column: "user_id" },
      { table: "announcements",    column: "id" },   // skip — not user-owned
      { table: "profiles",         column: "id" },
    ];

    for (const { table, column } of tables) {
      // Skip announcements — that's admin content, not per-user data
      if (table === "announcements") continue;
      await admin.from(table).delete().eq(column, userId);
    }

    // 3. Delete the auth record (requires service role)
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      return new Response(JSON.stringify({ error: deleteErr.message }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
