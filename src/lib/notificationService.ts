/**
 * MakersFlow Notification Service
 * Canonical data layer for student notifications via NestJS backend.
 */

import { apiClient } from "@/lib/auth/apiClient";

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  action_url?: string | null;
  link_url?: string | null;
  created_at: string;
}

export const notificationService = {
  /**
   * Fetches personal notifications belonging to the authenticated student via GET /notifications/me.
   * Student identity is derived exclusively from JWT.
   */
  async getMyNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await apiClient.get<NotificationItem[]>("/notifications/me");
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? (res as unknown as NotificationItem[])
          : [];

      return list.map((item: any) => ({
        id: String(item.id),
        user_id: String(item.user_id),
        type: item.type || "info",
        title: item.title || "Notification",
        body: item.body ?? null,
        is_read: Boolean(item.is_read),
        action_url: item.action_url ?? null,
        link_url: item.link_url ?? item.action_url ?? null,
        created_at: item.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error("[notificationService] getMyNotifications error:", error);
      throw error;
    }
  },

  /**
   * Fetches unread notification count via GET /notifications/unread-count.
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<{ unreadCount: number }>("/notifications/unread-count");
      const raw = res?.data !== undefined ? res.data : (res as any);
      if (typeof raw?.unreadCount === "number") {
        return raw.unreadCount;
      }
      if (typeof raw === "number") {
        return raw;
      }
      return 0;
    } catch (error) {
      console.error("[notificationService] getUnreadCount error:", error);
      return 0;
    }
  },

  /**
   * Marks a single notification as read via PATCH /notifications/:id/read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!notificationId) return;
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error(`[notificationService] markAsRead error for ${notificationId}:`, error);
      throw error;
    }
  },

  /**
   * Marks all personal notifications for the student as read via PATCH /notifications/read-all.
   */
  async markAllAsRead(): Promise<{ success: boolean; updatedCount: number }> {
    try {
      const res = await apiClient.patch<{ success: boolean; updatedCount: number }>("/notifications/read-all");
      const raw = res?.data !== undefined ? res.data : (res as any);
      return {
        success: Boolean(raw?.success ?? true),
        updatedCount: typeof raw?.updatedCount === "number" ? raw.updatedCount : 0,
      };
    } catch (error) {
      console.error("[notificationService] markAllAsRead error:", error);
      throw error;
    }
  },

  /**
   * Deletes a student's own notification via DELETE /notifications/:id.
   */
  async deleteNotification(notificationId: string): Promise<void> {
    if (!notificationId) return;
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error(`[notificationService] deleteNotification error for ${notificationId}:`, error);
      throw error;
    }
  },
};
