import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/integrations/supabase/auth";

/**
 * Redirects to /login when auth finishes loading and there is no user.
 * Returns { user, loading } so callers can gate rendering while loading.
 *
 * Pattern used by: dashboard.tsx, profile.tsx, checkout.tsx,
 *                  progress.tsx, my-learning.tsx, learn.$courseId.$lessonId.tsx
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  return { user, loading };
}
