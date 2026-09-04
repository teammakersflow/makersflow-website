/**
 * MakersFlow News Service
 * Canonical data layer for news articles via NestJS backend.
 */

import { apiClient } from "@/lib/auth/apiClient";

export interface NewsArticle {
  id: string; // BigInt ID safely represented as string
  title: string;
  slug: string;
  content: string | null;
  status: string | null;
  created_at: string;
  thumbnail_url: string | null;
  created_by?: string | null;
}

export const newsService = {
  /**
   * Fetches published news articles via GET /news.
   * Preserves BigInt IDs safely as strings without Number() conversion.
   */
  async getNews(): Promise<NewsArticle[]> {
    try {
      const res = await apiClient.get<NewsArticle[]>("/news");
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? (res as unknown as NewsArticle[])
          : [];

      return list
        .filter((item: any) => !item.status || item.status === "published" || item.status === "active")
        .map((item: any) => ({
          id: String(item.id),
          title: item.title || "Untitled Article",
          slug: item.slug || String(item.id),
          content: item.content ?? null,
          status: item.status ?? "published",
          created_at: item.created_at || new Date().toISOString(),
          thumbnail_url: item.thumbnail_url ?? null,
          created_by: item.created_by ? String(item.created_by) : null,
        }));
    } catch (error) {
      console.error("[newsService] getNews error:", error);
      throw error;
    }
  },

  /**
   * Fetches a single news article by ID via GET /news/:id.
   * ID is passed as a string to preserve BigInt precision.
   */
  async getNewsById(id: string): Promise<NewsArticle | null> {
    if (!id || id === "undefined" || id === "null") return null;

    try {
      const res = await apiClient.get<NewsArticle>(`/news/${encodeURIComponent(id)}`);
      const item = (res?.data !== undefined && (res as any)?.success !== undefined ? res.data : res) as any;

      if (!item || typeof item !== "object" || !item.id) {
        return null;
      }

      return {
        id: String(item.id),
        title: item.title || "Untitled Article",
        slug: item.slug || String(item.id),
        content: item.content ?? null,
        status: item.status ?? "published",
        created_at: item.created_at || new Date().toISOString(),
        thumbnail_url: item.thumbnail_url ?? null,
        created_by: item.created_by ? String(item.created_by) : null,
      };
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      console.error(`[newsService] getNewsById error for ${id}:`, error);
      throw error;
    }
  },
};
