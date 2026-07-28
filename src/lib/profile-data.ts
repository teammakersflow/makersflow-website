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



export async function changePassword(
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Authentication service is not configured. Please check your environment setup (.env)." };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error("[changePassword] Auth error:", error);
    return { ok: false, error: "Password doesn't meet the requirements above. Please check each rule and try again." };
  }
  return { ok: true };
}
