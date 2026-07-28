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
  return supabase.auth.signUp({
    email,
    password,
    options: { data: metadata, emailRedirectTo: redirectTo },
  });
}

export async function signInWithGoogle(redirect?: string) {
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
