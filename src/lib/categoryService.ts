/**
 * MakersFlow Category Service
 * Canonical data layer for category management via NestJS backend.
 */

import { apiClient } from "@/lib/auth/apiClient";

export interface CategoryItem {
  id: string; // BigInt ID safely represented as string
  name: string;
  slug: string;
  created_at?: string | null;
}

// In-memory cache and in-flight request deduplication
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds
let categoriesCache: CacheEntry<CategoryItem[]> | null = null;
let pendingCategoriesPromise: Promise<CategoryItem[]> | null = null;

function isCacheValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.timestamp < CACHE_TTL_MS;
}

export const categoryService = {
  /**
   * Clears the in-memory categories cache.
   */
  invalidateCache() {
    categoriesCache = null;
    pendingCategoriesPromise = null;
  },

  /**
   * Fetches all categories via GET /categories.
   * Cached with in-flight deduplication. BigInt IDs are safely kept as strings.
   */
  async getCategories(options?: { forceFresh?: boolean }): Promise<CategoryItem[]> {
    if (!options?.forceFresh && isCacheValid(categoriesCache)) {
      return categoriesCache.data;
    }

    if (pendingCategoriesPromise) {
      return pendingCategoriesPromise;
    }

    pendingCategoriesPromise = (async () => {
      try {
        const res = await apiClient.get<CategoryItem[]>("/categories");
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? (res as unknown as CategoryItem[])
            : [];

        const normalized: CategoryItem[] = list.map((item: any) => ({
          id: String(item.id),
          name: item.name || "General",
          slug: item.slug || String(item.id),
          created_at: item.created_at ?? null,
        }));

        categoriesCache = {
          data: normalized,
          timestamp: Date.now(),
        };

        return normalized;
      } catch (error) {
        console.error("[categoryService] getCategories error:", error);
        throw error;
      } finally {
        pendingCategoriesPromise = null;
      }
    })();

    return pendingCategoriesPromise;
  },

  /**
   * Fetches single category by ID via GET /categories/:id.
   * ID is passed as a string to preserve BigInt precision.
   */
  async getCategoryById(id: string): Promise<CategoryItem | null> {
    if (!id || id === "undefined" || id === "null") return null;

    try {
      const res = await apiClient.get<CategoryItem>(`/categories/${encodeURIComponent(id)}`);
      const item = (res?.data !== undefined && (res as any)?.success !== undefined ? res.data : res) as any;

      if (!item || typeof item !== "object" || !item.id) {
        return null;
      }

      return {
        id: String(item.id),
        name: item.name || "General",
        slug: item.slug || String(item.id),
        created_at: item.created_at ?? null,
      };
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      console.error(`[categoryService] getCategoryById error for ${id}:`, error);
      throw error;
    }
  },
};
