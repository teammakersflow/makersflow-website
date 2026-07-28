import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./client";

/**
 * Auth helpers for MakersFlow web. Mirrors the shape used by the
 * mobile app so screens can share patterns later.
 */

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(
  email: string,
  password: string,
  metadata?: Record<string, unknown>,
  redirect?: string,
) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectTo = redirect ? `${origin}${redirect}` : `${origin}/`;

  // ── FIX ────────────────────────────────────────────────────────────────
  // The mobile app sends its display name under the metadata key `name`
  // (services/authService.ts), while this web app sent `full_name`. Any DB
  // trigger reading raw_user_meta_data can only match one of them, so users
  // created on one platform arrived with a null name on the other.
  // Send both keys so whichever the trigger reads, it finds a value.
  const data = { ...(metadata ?? {}) } as Record<string, unknown>;
  if (data.full_name && !data.name) data.name = data.full_name;
  if (data.name && !data.full_name) data.full_name = data.name;

  return supabase.auth.signUp({
    email,
    password,
    options: { data, emailRedirectTo: redirectTo },
  });
}

export async function signInWithGoogle(redirect?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectTo = redirect ? `${origin}${redirect}` : `${origin}/`;
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      // ── FIX ──────────────────────────────────────────────────────────────
      // Without prompt=select_account, Google silently reuses whichever
      // account the browser signed in with last. Anyone with two Google
      // accounts (personal + school, very common here) had no way to switch,
      // and would land in the wrong MakersFlow profile with no obvious cause.
      queryParams: { prompt: "select_account" },
    },
  });
}

/**
 * Send a password-recovery email.
 * `redirectTo` must be listed under Authentication -> URL Configuration ->
 * Redirect URLs in the Supabase dashboard, or the link in the email 404s.
 */
export async function sendPasswordReset(email: string, redirectPath = "/reset-password") {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}${redirectPath}`,
  });
}

/**
 * Change the password of the currently signed-in user.
 * Used by both the recovery screen and the in-app "change password" form.
 */
export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

/**
 * Re-send the signup confirmation email.
 * Needed because "Email not confirmed" was previously a dead end — the user
 * had no way to get another link.
 */
export async function resendConfirmationEmail(email: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/` },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * Subscribes to Supabase auth state. Returns { session, user, loading }.
 * Listener is registered first to avoid missing the initial event.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialised = false;

    // Register the listener first so we never miss an event.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Only clear loading once — whichever of the two paths fires first wins.
      if (!initialised) {
        initialised = true;
        setLoading(false);
      }
    });

    // Fallback: if the listener hasn't fired yet, resolve from the cached session.
    supabase.auth.getSession().then(({ data }) => {
      if (!initialised) {
        initialised = true;
        setSession(data.session);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}
