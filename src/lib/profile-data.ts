import { customAuthService, UpdateProfileInput } from "./auth/customAuthService";
import type { Profile } from "./dashboard-data";

/**
 * Updates authenticated user profile via NestJS backend (PATCH /users/profile).
 * Accepts either updateProfile(userId, patch) or updateProfile(patch).
 * Note: userId is not sent to backend because JWT Bearer token identifies the current user.
 */
export async function updateProfile(
  userIdOrPatch: string | Partial<Omit<Profile, "id">>,
  maybePatch?: Partial<Omit<Profile, "id">>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const rawPatch =
      typeof userIdOrPatch === "string"
        ? (maybePatch ?? {})
        : (userIdOrPatch ?? {});

    const dto: UpdateProfileInput = {
      ...(rawPatch.full_name !== undefined ? { full_name: rawPatch.full_name || undefined } : {}),
      ...(rawPatch.grade !== undefined ? { grade: rawPatch.grade || undefined } : {}),
      ...(rawPatch.school !== undefined ? { school: rawPatch.school || undefined } : {}),
      ...(rawPatch.avatar_url !== undefined ? { avatar_url: rawPatch.avatar_url || undefined } : {}),
      ...(rawPatch.phone !== undefined ? { phone: rawPatch.phone || undefined } : {}),
    };

    const res = await customAuthService.updateProfile(dto);
    if (!res.data && res.error) {
      return { ok: false, error: res.error };
    }
    return { ok: true };
  } catch (e: unknown) {
    console.error("[updateProfile] Backend error:", e);
    const msg = e instanceof Error ? e.message : "Could not update profile. Please try again.";
    return { ok: false, error: msg };
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
  _newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  return {
    ok: false,
    error: "Account credentials and security are managed through Google Account Security.",
  };
}
