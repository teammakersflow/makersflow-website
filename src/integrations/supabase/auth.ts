import { useEffect, useState } from "react";
import { AuthError, type Session, type User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./client";

const CONFIG_ERROR = new AuthError(
  "Authentication service is not configured. Please check your environment setup (.env).",
  500,
);

export async function signInWithPassword(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    return { data: { user: null, session: null }, error: CONFIG_ERROR };
  }
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(
  email: string,
  password: string,
  metadata?: Record<string, unknown>,
  redirect?: string,
) {
  if (!isSupabaseConfigured()) {
    return { data: { user: null, session: null }, error: CONFIG_ERROR };
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectTo = redirect ? `${origin}${redirect}` : `${origin}/`;
  return supabase.auth.signUp({
    email,
    password,
    options: { data: metadata, emailRedirectTo: redirectTo },
  });
}

export async function signInWithGoogle(redirect?: string) {
  if (!isSupabaseConfigured()) {
    return { data: { provider: "google" as const, url: null }, error: CONFIG_ERROR };
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectTo = redirect ? `${origin}${redirect}` : `${origin}/`;
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}

export async function signOut(scope: "global" | "local" | "others" = "global") {
  return supabase.auth.signOut({ scope });
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
