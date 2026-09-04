/**
 * MakersFlow Announcement Service
 * Canonical data layer for broadcast announcements via NestJS backend.
 */

import { apiClient } from "@/lib/auth/apiClient";

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string | null;
  type: string | null;
  link_url: string | null;
  status: string;
  created_at: string;
  scheduled_at: string | null;
}

export const announcementService = {
  /**
   * Fetches active broadcast announcements for students via GET /announcements/active.
   */
  async getActiveAnnouncements(): Promise<AnnouncementItem[]> {
    try {
      const res = await apiClient.get<AnnouncementItem[]>("/announcements/active");
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? (res as unknown as AnnouncementItem[])
          : [];

      return list.map((item: any) => ({
        id: String(item.id),
        title: item.title || "Announcement",
        message: item.message ?? null,
        type: item.type ?? "info",
        link_url: item.link_url ?? null,
        status: item.status || "published",
        created_at: item.created_at || new Date().toISOString(),
        scheduled_at: item.scheduled_at ?? null,
      }));
    } catch (error) {
      console.error("[announcementService] getActiveAnnouncements error:", error);
      return [];
    }
  },
};
