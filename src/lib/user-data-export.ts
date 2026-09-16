import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "./auth/apiClient";
import type { BackendUser } from "./auth/customAuthService";
import { tokenStorage } from "./auth/tokenStorage";
import { enrollmentService } from "./enrollmentService";
import { progressService } from "./progressService";
import { orderService } from "./orderService";
import { wishlistService } from "./wishlistService";

export async function exportUserData(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    // 1. Fetch user profile from NestJS backend (or local cache)
    let profileData: BackendUser | null = null;
    const cached = tokenStorage.getUser();
    if (cached && cached.id === userId) {
      profileData = cached as BackendUser;
    } else {
      try {
        const res = await apiClient.get<BackendUser>(`/users/${userId}`);
        profileData = res.data ?? null;
      } catch {
        profileData = null;
      }
    }

    const [
      myEnrollments,
      myOrders,
      wishlistItems,
      favoritesRes,
      watchLaterRes,
      quizAttemptsRes,
      reviewsRes,
    ] = await Promise.all([
      enrollmentService.getMyEnrollments(),
      orderService.getMyOrders(),
      wishlistService.getWishlistItems(userId),
      apiClient.get<any[]>("/course-favorites").then((r) => r.data ?? []).catch(() => []),
      apiClient.get<any[]>("/watch-later").then((r) => r.data ?? []).catch(() => []),
      apiClient.get<any[]>("/quiz-attempts/me")
        .then((r) => r.data ?? (Array.isArray(r) ? r : []))
        .catch(async () => {
          try {
            const { data } = await supabase.from("quiz_attempts").select("*").eq("user_id", userId);
            return data ?? [];
          } catch {
            return [];
          }
        }),
      apiClient.get<any[]>("/reviews/me")
        .then((r) => r.data ?? (Array.isArray(r) ? r : []))
        .catch(async () => {
          try {
            const { data } = await supabase.from("reviews").select("*").eq("user_id", userId);
            return data ?? [];
          } catch {
            return [];
          }
        }),
    ]);

    const quizAttempts = Array.isArray(quizAttemptsRes) ? quizAttemptsRes : [];
    const reviews = Array.isArray(reviewsRes) ? reviewsRes : [];

    const favorites = Array.isArray(favoritesRes) ? favoritesRes : [];
    const watchLater = Array.isArray(watchLaterRes) ? watchLaterRes : [];

    // Fetch progress for each enrolled course
    const courseProgressPromises = (myEnrollments as any[]).map((e) =>
      progressService.getCourseProgress(e.course_id),
    );
    const courseProgressResults = await Promise.all(courseProgressPromises);
    const allProgressRecords = courseProgressResults.flatMap(
      (cp) => cp?.lessonsProgress ?? [],
    );

    const profile = profileData;

    const exportData = {
      export_metadata: {
        platform: "MakersFlow Web",
        exported_at: new Date().toISOString(),
        user_id: userId,
        statutory_compliance: "India DPDP Act Data Portability Dump",
      },
      profile: profile ?? null,
      learning_activity: {
        enrolled_courses: myEnrollments ?? [],
        lesson_progress: allProgressRecords,
        quiz_attempts: quizAttempts ?? [],
        favorites: favorites ?? [],
        watch_later: watchLater ?? [],
      },
      commerce_and_reviews: {
        orders: myOrders ?? [],
        wishlist: wishlistItems ?? [],
        reviews: reviews ?? [],
      },
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `makersflow-data-export-${userId.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { ok: true };
  } catch (err: any) {
    console.error("[exportUserData] Failed:", err);
    return { ok: false, error: err?.message || "Data export failed" };
  }
}
