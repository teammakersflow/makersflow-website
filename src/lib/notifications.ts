import { supabase } from "@/integrations/supabase/client";

/** localStorage key tracking when the current browser last viewed /notifications. */
export const NOTIFICATIONS_LAST_SEEN_KEY = "notifications_last_seen";

/**
 * Returns true if there's a published notification newer than the last time
 * this browser visited the Notifications page. Used to drive the sidebar's
 * unread dot. This is a lightweight, per-device check (no extra read-tracking
 * table) — good enough for "has something new arrived from the admin panel".
 */
export async function hasUnreadNotifications(): Promise<boolean> {
  const { data } = await supabase
    .from("announcements")
    .select("created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1);

  const latest = (data as { created_at: string }[] | null)?.[0]?.created_at;
  if (!latest) return false;

  const lastSeen = localStorage.getItem(NOTIFICATIONS_LAST_SEEN_KEY);
  if (!lastSeen) return true;

  return new Date(latest).getTime() > new Date(lastSeen).getTime();
}
