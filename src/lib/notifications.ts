import { supabase } from "@/integrations/supabase/client";
import { tokenStorage } from "@/lib/auth/tokenStorage";

/** localStorage key tracking when the current browser last viewed /notifications. */
export const NOTIFICATIONS_LAST_SEEN_KEY = "notifications_last_seen";

/**
 * Returns true if the authenticated user has unread notifications in the `notifications` table.
 */
export async function hasUnreadNotifications(explicitUserId?: string): Promise<boolean> {
  const userId = explicitUserId || tokenStorage.getUser()?.id;
  if (!userId) return false;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) return false;
  return (count ?? 0) > 0;
}

/**
 * Marks all unread notifications for the given user as read in Supabase
 * and updates the local last-seen timestamp.
 */
export async function markNotificationsAsRead(userId: string): Promise<void> {
  try {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
  } catch (e) {
    console.warn("Could not mark notifications as read:", e);
  } finally {
    localStorage.setItem(NOTIFICATIONS_LAST_SEEN_KEY, new Date().toISOString());
  }
}
