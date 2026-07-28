import { supabase } from "@/integrations/supabase/client";
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
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error("[changePassword] Auth error:", error);
    return { ok: false, error: error.message || "Could not update password. Please try again." };
  }
  return { ok: true };
}
