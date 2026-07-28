import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { Profile } from "./dashboard-data";

export async function updateProfile(
  userId: string,
  patch: Partial<Omit<Profile, "id">>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) {
      console.error("[updateProfile] DB error:", error);
      return { ok: false, error: "Could not update profile. Please try again." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[updateProfile] Exception:", e);
    return { ok: false, error: "Could not update profile. Please try again." };
  }
}



export function mapPasswordChangeError(error: { message?: string; status?: number; code?: string }): string {
  const code = (error?.code ?? "").toLowerCase();
  const msg = (error?.message ?? "").toLowerCase();
  const status = error?.status;

  // 1. Session / Auth Expiry (Most Specific: Status 401/403 or session/jwt codes)
  if (
    status === 401 ||
    status === 403 ||
    code === "session_expired" ||
    code === "token_expired" ||
    code === "jwt_expired" ||
    msg.includes("jwt") ||
    msg.includes("session expired") ||
    msg.includes("not authenticated")
  ) {
    return "Your session has expired. Please sign in again.";
  }

  // 2. Rate Limiting (Status 429 or rate limit code)
  if (
    status === 429 ||
    code.includes("rate_limit") ||
    msg.includes("rate limit") ||
    msg.includes("too many")
  ) {
    return "Too many password update attempts. Please wait a few minutes and try again.";
  }

  // 3. Same Password (Specific code / same password strings)
  if (
    code === "same_password" ||
    msg.includes("same_password") ||
    msg.includes("same as current") ||
    msg.includes("should be different")
  ) {
    return "New password must be different from your current password.";
  }

  // 4. Weak Password / Requirements (Specific weak_password code or policy strings)
  if (
    code === "weak_password" ||
    code === "password_policy_automata_failed" ||
    msg.includes("weak_password") ||
    msg.includes("policy") ||
    msg.includes("requirements")
  ) {
    return "New password does not meet the requirements. Use at least 8 characters with lowercase, uppercase, number, and special character.";
  }

  // 5. Generic Password Catch-All (Least Specific: fallback when "password" is mentioned)
  if (msg.includes("password")) {
    return "New password does not meet the requirements listed above.";
  }

  return "Could not update password. Please check your details and try again.";
}

export async function changePassword(
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Authentication service is not configured. Please check your environment setup (.env)." };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error("[changePassword] Auth error:", error);
    return { ok: false, error: mapPasswordChangeError(error) };
  }
  return { ok: true };
}
