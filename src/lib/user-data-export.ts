import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "./auth/apiClient";
import type { BackendUser } from "./auth/customAuthService";
import { tokenStorage } from "./auth/tokenStorage";
import { enrollmentService } from "./enrollmentService";
import { progressService } from "./progressService";
import { orderService } from "./orderService";

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

    const [myEnrollments, myOrders, ...otherResults] = await Promise.all([
      enrollmentService.getMyEnrollments(),
      orderService.getMyOrders(),
      supabase.from("quiz_attempts").select("*").eq("user_id", userId),
      supabase.from("course_favorites").select("*").eq("user_id", userId),
      supabase.from("watch_later").select("*").eq("user_id", userId),
      supabase.from("wishlist").select("*").eq("user_id", userId),
      supabase.from("reviews").select("*").eq("user_id", userId),
    ]);

    const [
      { data: quizAttempts },
      { data: favorites },
      { data: watchLater },
      { data: wishlist },
      { data: reviews },
    ] = otherResults as any[];

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
        wishlist: wishlist ?? [],
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
