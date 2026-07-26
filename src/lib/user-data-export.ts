import { supabase } from "@/integrations/supabase/client";

export async function exportUserData(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const [
      { data: profile },
      { data: enrollments },
      { data: progress },
      { data: quizAttempts },
      { data: orders },
      { data: favorites },
      { data: watchLater },
      { data: wishlist },
      { data: reviews },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("enrollments").select("*, courses(title, category)").eq("user_id", userId),
      supabase.from("lesson_progress").select("*").eq("user_id", userId),
      supabase.from("quiz_attempts").select("*").eq("user_id", userId),
      supabase.from("orders").select("*").eq("user_id", userId),
      supabase.from("course_favorites").select("*").eq("user_id", userId),
      supabase.from("watch_later").select("*").eq("user_id", userId),
      supabase.from("wishlist").select("*").eq("user_id", userId),
      supabase.from("reviews").select("*").eq("user_id", userId),
    ]);

    const exportData = {
      export_metadata: {
        platform: "MakersFlow Web",
        exported_at: new Date().toISOString(),
        user_id: userId,
        statutory_compliance: "India DPDP Act Data Portability Dump",
      },
      profile: profile ?? null,
      learning_activity: {
        enrolled_courses: enrollments ?? [],
        lesson_progress: progress ?? [],
        quiz_attempts: quizAttempts ?? [],
        favorites: favorites ?? [],
        watch_later: watchLater ?? [],
      },
      commerce_and_reviews: {
        orders: orders ?? [],
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
