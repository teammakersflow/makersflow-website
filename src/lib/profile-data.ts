import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "./dashboard-data";

export async function updateProfile(
  userId: string,
  patch: Partial<Omit<Profile, "id">>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || `image/${ext}`,
    });
    if (upErr) return { ok: false, error: upErr.message };
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl;
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", userId);
    if (updErr) return { ok: false, error: updErr.message, url };
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function changePassword(
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
