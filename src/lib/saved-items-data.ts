import { apiClient } from "./auth/apiClient";
import { wishlistService } from "./wishlistService";
import { resolveCourseId } from "./explore-data";

// ── Course Favorites ────────────────────────────────────────────────────────

let courseFavoritesCache: { data: string[]; timestamp: number } | null = null;
let pendingCourseFavoritesPromise: Promise<string[]> | null = null;

export function invalidateCourseFavoritesCache(): void {
  courseFavoritesCache = null;
  pendingCourseFavoritesPromise = null;
}

export async function getCourseFavorites(userId?: string): Promise<string[]> {
  if (!userId) return [];
  const now = Date.now();
  if (courseFavoritesCache && now - courseFavoritesCache.timestamp < 15000) {
    return courseFavoritesCache.data;
  }

  if (pendingCourseFavoritesPromise) {
    return pendingCourseFavoritesPromise;
  }

  pendingCourseFavoritesPromise = (async () => {
    try {
      const res = await apiClient.get<any[]>("/course-favorites");
      const items = res.data ?? [];
      if (Array.isArray(items)) {
        const ids = items.map((r: any) => String(r.course_id ?? r.courses?.id ?? r.id));
        courseFavoritesCache = { data: ids, timestamp: Date.now() };
        return ids;
      }
    } catch (e: any) {
      if (import.meta.env.DEV) {
        console.warn("[saved-items-data] /course-favorites fetch error:", e);
      }
    }
    return [];
  })().finally(() => {
    pendingCourseFavoritesPromise = null;
  });

  return pendingCourseFavoritesPromise;
}

export async function isCourseFavorite(userId: string, courseId: string | number): Promise<boolean> {
  if (!userId) return false;
  const str = String(courseId);
  if (str.startsWith("demo-")) {
    try {
      const list = JSON.parse(localStorage.getItem(`demo_favs_${userId}`) || "[]");
      return list.includes(str);
    } catch {
      return false;
    }
  }

  try {
    const targetCourseId = await resolveCourseId(courseId);
    const list = await getCourseFavorites(userId);
    return list.includes(String(targetCourseId));
  } catch {
    return false;
  }
}

export async function toggleCourseFavorite(
  userId: string,
  courseId: string | number,
): Promise<{ favorite: boolean; error?: string }> {
  if (!userId) return { favorite: false, error: "Please sign in to favorite courses" };

  const str = String(courseId);
  if (str.startsWith("demo-")) {
    try {
      const key = `demo_favs_${userId}`;
      let list = JSON.parse(localStorage.getItem(key) || "[]");
      const isFav = list.includes(str);
      if (isFav) {
        list = list.filter((id: string) => id !== str);
      } else {
        list.push(str);
      }
      localStorage.setItem(key, JSON.stringify(list));
      return { favorite: !isFav };
    } catch {
      return { favorite: false, error: "Could not update demo favorites" };
    }
  }

  try {
    const targetCourseId = await resolveCourseId(courseId);
    const isFav = await isCourseFavorite(userId, targetCourseId);
    invalidateCourseFavoritesCache();

    if (isFav) {
      await apiClient.delete(`/course-favorites/${encodeURIComponent(String(targetCourseId))}`);
      return { favorite: false };
    } else {
      await apiClient.post(`/course-favorites/${encodeURIComponent(String(targetCourseId))}`);
      return { favorite: true };
    }
  } catch (err: any) {
    console.error("[toggleCourseFavorite] Error:", err);
    invalidateCourseFavoritesCache();
    return { favorite: false, error: "Could not update course favorites" };
  }
}

// ── Watch Later ────────────────────────────────────────────────────────────

let watchLaterCache: { data: string[]; timestamp: number } | null = null;
let pendingWatchLaterPromise: Promise<string[]> | null = null;

export function invalidateWatchLaterCache(): void {
  watchLaterCache = null;
  pendingWatchLaterPromise = null;
}

export async function getWatchLater(userId?: string): Promise<string[]> {
  if (!userId) return [];
  const now = Date.now();
  if (watchLaterCache && now - watchLaterCache.timestamp < 15000) {
    return watchLaterCache.data;
  }

  if (pendingWatchLaterPromise) {
    return pendingWatchLaterPromise;
  }

  pendingWatchLaterPromise = (async () => {
    try {
      const res = await apiClient.get<any[]>("/watch-later");
      const items = res.data ?? [];
      if (Array.isArray(items)) {
        const ids = items.map((r: any) => String(r.course_id ?? r.courses?.id ?? r.id));
        watchLaterCache = { data: ids, timestamp: Date.now() };
        return ids;
      }
    } catch (e: any) {
      if (import.meta.env.DEV) {
        console.warn("[saved-items-data] /watch-later fetch error:", e);
      }
    }
    return [];
  })().finally(() => {
    pendingWatchLaterPromise = null;
  });

  return pendingWatchLaterPromise;
}

export async function isWatchLater(userId: string, courseId: string | number): Promise<boolean> {
  if (!userId) return false;
  const str = String(courseId);
  if (str.startsWith("demo-")) {
    try {
      const list = JSON.parse(localStorage.getItem(`demo_watch_later_${userId}`) || "[]");
      return list.includes(str);
    } catch {
      return false;
    }
  }

  try {
    const targetCourseId = await resolveCourseId(courseId);
    const list = await getWatchLater(userId);
    return list.includes(String(targetCourseId));
  } catch {
    return false;
  }
}

export async function toggleWatchLater(
  userId: string,
  courseId: string | number,
): Promise<{ saved: boolean; error?: string }> {
  if (!userId) return { saved: false, error: "Please sign in to save for watch later" };

  const str = String(courseId);
  if (str.startsWith("demo-")) {
    try {
      const key = `demo_watch_later_${userId}`;
      let list = JSON.parse(localStorage.getItem(key) || "[]");
      const isSaved = list.includes(str);
      if (isSaved) {
        list = list.filter((id: string) => id !== str);
      } else {
        list.push(str);
      }
      localStorage.setItem(key, JSON.stringify(list));
      return { saved: !isSaved };
    } catch {
      return { saved: false, error: "Could not update watch later list" };
    }
  }

  try {
    const targetCourseId = await resolveCourseId(courseId);
    const isSaved = await isWatchLater(userId, targetCourseId);
    invalidateWatchLaterCache();

    if (isSaved) {
      await apiClient.delete(`/watch-later/${encodeURIComponent(String(targetCourseId))}`);
      return { saved: false };
    } else {
      await apiClient.post(`/watch-later/${encodeURIComponent(String(targetCourseId))}`);
      return { saved: true };
    }
  } catch (err: any) {
    console.error("[toggleWatchLater] Error:", err);
    invalidateWatchLaterCache();
    return { saved: false, error: "Could not update watch later list" };
  }
}

// ── Product Wishlist ────────────────────────────────────────────────────────

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  return wishlistService.isInWishlist(productId, userId);
}

export async function toggleWishlist(
  userId: string,
  productId: string,
): Promise<{ wishlisted: boolean; error?: string }> {
  return wishlistService.toggleWishlist(productId, userId);
}
