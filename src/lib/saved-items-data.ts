import { supabase } from "@/integrations/supabase/client";
import { wishlistService } from "./wishlistService";
import { resolveCourseId } from "./explore-data";

// ── Course Favorites ────────────────────────────────────────────────────────

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
    const { data } = await supabase
      .from("course_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", targetCourseId)
      .maybeSingle();
    return !!data;
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
    const { data: existing } = await supabase
      .from("course_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", targetCourseId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("course_favorites").delete().eq("id", existing.id);
      if (error) throw error;
      return { favorite: false };
    } else {
      const { error } = await supabase
        .from("course_favorites")
        .insert({ user_id: userId, course_id: targetCourseId });
      if (error) throw error;
      return { favorite: true };
    }
  } catch (err: any) {
    console.error("[toggleCourseFavorite] Error:", err);
    return { favorite: false, error: "Could not update course favorites" };
  }
}

// ── Watch Later ────────────────────────────────────────────────────────────

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
    const { data } = await supabase
      .from("watch_later")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", targetCourseId)
      .maybeSingle();
    return !!data;
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
    const { data: existing } = await supabase
      .from("watch_later")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", targetCourseId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("watch_later").delete().eq("id", existing.id);
      if (error) throw error;
      return { saved: false };
    } else {
      const { error } = await supabase
        .from("watch_later")
        .insert({ user_id: userId, course_id: targetCourseId });
      if (error) throw error;
      return { saved: true };
    }
  } catch (err: any) {
    console.error("[toggleWatchLater] Error:", err);
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
