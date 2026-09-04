import { notificationService } from "@/lib/notificationService";

/** localStorage key tracking when the current browser last viewed /notifications. */
export const NOTIFICATIONS_LAST_SEEN_KEY = "notifications_last_seen";

/**
 * Returns true if the authenticated user has unread notifications via NestJS backend.
 * Retains backward-compatible signature.
 */
export async function hasUnreadNotifications(_explicitUserId?: string): Promise<boolean> {
  try {
    const unreadCount = await notificationService.getUnreadCount();
    return unreadCount > 0;
  } catch (err) {
    console.error("[notifications] Failed to check unread notifications:", err);
    return false;
  }
}

/**
 * Marks all unread notifications for the user as read in NestJS backend
 * and updates the local last-seen timestamp.
 * Retains backward-compatible signature.
 */
export async function markNotificationsAsRead(_userId?: string): Promise<void> {
  try {
    await notificationService.markAllAsRead();
  } catch (e) {
    console.warn("Could not mark notifications as read:", e);
  } finally {
    localStorage.setItem(NOTIFICATIONS_LAST_SEEN_KEY, new Date().toISOString());
  }
}
