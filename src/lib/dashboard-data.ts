import { supabase } from "@/integrations/supabase/client";
import { fetchCourseProgressMap } from "./learn-data";
// FALLBACK: CourseCard[] — demo courses used in two places:
//   1. fetchContinueLesson: looks up title/thumbnail for demo progress stored in localStorage
//   2. fetchRecommended: returned as fallback when Supabase courses table is empty
// DEMO_MODULES: Module[] — used in fetchContinueLesson to find the next incomplete lesson
//   by iterating module/lesson structure for demo-* course IDs.
// Both exports exist in ./explore-data — import is valid.
import { FALLBACK, DEMO_MODULES } from "./explore-data";
import type { CourseCard } from "./landing-data";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  grade: string | null;
  school: string | null;
  role: string | null;
};

export type DashboardStats = {
  enrolled: number;
  completed: number;
  avgProgress: number;
  totalHours: number;
};

export type ContinueLesson = {
  course_id: string;
  course_title: string;
  course_thumbnail: string | null;
  lesson_id: string;
  lesson_title: string;
  progress: number; // 0..100
  last_watched_at: string | null;
};

export type WeeklyPoint = { day: string; date: string; count: number; isToday: boolean };

export type StreakInfo = {
  current_streak: number;
  longest_streak: number;
};

export type Achievement = {
  id: string;
  label: string;
  icon: string;
  unlocked: boolean;
  description: string;
};

const safe = async <T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[makersflow] ${label} failed, using fallback:`, err);
    return fallback;
  }
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  return safe(
    async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, grade, school, role")
        .eq("id", userId)
        .maybeSingle();
      return (data as Profile | null) ?? null;
    },
    null,
    "fetchProfile",
  );
}

export async function fetchStreak(userId: string): Promise<StreakInfo> {
  return safe(
    async () => {
      const { data } = await supabase
        .from("streaks")
        .select("current_streak, longest_streak")
        .eq("user_id", userId)
        .maybeSingle();
      return {
        current_streak: (data as any)?.current_streak ?? 0,
        longest_streak: (data as any)?.longest_streak ?? 0,
      };
    },
    { current_streak: 0, longest_streak: 0 },
    "fetchStreak",
  );
}

export async function fetchStats(userId: string): Promise<DashboardStats> {
  console.log("[fetchStats] Start, userId:", userId);
  return safe(
    async () => {
      const { data: enr, error: enrError } = await supabase
        .from("enrollments")
        .select("id, course_id, completed_at")
        .eq("user_id", userId);
      
      console.log("[fetchStats] Enrollments result:", enr, "Error:", enrError);
      
      const enrRows =
        (enr as Array<{
          id: string;
          course_id: string;
          completed_at?: string | null;
        }>) ?? [];

      const rows = [];
      for (const r of enrRows) {
        console.log("[fetchStats] Fetching progress for course:", r.course_id);
        const courseIdStr = String(r.course_id);
        // Get lesson IDs for this course
        const { data: modulesData } = await supabase.from("modules").select("id").eq("course_id", courseIdStr);
        const moduleIds = (modulesData ?? []).map((m: any) => m.id);
        let percentage = 0;
        if (moduleIds.length > 0) {
          const { data: lessonsData } = await supabase.from("lessons").select("id").in("module_id", moduleIds);
          const lessonIds = (lessonsData ?? []).map((l: any) => Number(l.id));
          if (lessonIds.length > 0) {
            const { data: progressData } = await supabase
              .from("lesson_progress")
              .select("lesson_id, is_completed, watch_percentage")
              .eq("user_id", userId)
              .in("lesson_id", lessonIds);
            const pRows = progressData ?? [];
            const completedCount = pRows.filter((p: any) => p.is_completed).length;
            percentage = lessonIds.length ? Math.round((completedCount / lessonIds.length) * 100) : 0;
          }
        }
        console.log(`[fetchStats] Course ${r.course_id} progress calculated:`, percentage);
        rows.push({
          progress: percentage,
          completed_at: r.completed_at ?? null,
          status: r.completed_at ? "completed" : "active",
        });
      }

      let demoEnrollments: string[] = [];
      try {
        demoEnrollments = JSON.parse(localStorage.getItem(`demo_enrollments_${userId}`) || "[]");
      } catch {}

      const demoRows: Array<{
        progress: number;
        completed_at: string | null;
        status: string;
        time_spent_secs: number;
      }> = [];
      for (const demoId of demoEnrollments) {
        let progressMap: Record<string, any> = {};
        try {
          progressMap = JSON.parse(
            localStorage.getItem(`demo_progress_${userId}_${demoId}`) || "{}",
          );
        } catch {}
        const totalLessons = 12;
        const completedLessons = Object.values(progressMap).filter(
          (l: any) => l.is_completed,
        ).length;
        const progress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
        const timeSpent = Object.values(progressMap).reduce(
          (s: number, l: any) => s + (l.time_spent_secs ?? 0),
          0,
        );
        demoRows.push({
          progress,
          completed_at: progress >= 100 ? new Date().toISOString() : null,
          status: progress >= 100 ? "completed" : "active",
          time_spent_secs: timeSpent,
        });
      }

      const allRows = [
        ...rows.map((r) => ({
          progress: r.progress ?? 0,
          completed_at: r.completed_at ?? null,
          status: r.status ?? "active",
          time_spent_secs: 0,
        })),
        ...demoRows,
      ];
      const enrolled = allRows.length;
      const completed = allRows.filter(
        (r) => r.completed_at || r.status === "completed" || r.progress >= 100,
      ).length;
      const avg = enrolled ? Math.round(allRows.reduce((s, r) => s + r.progress, 0) / enrolled) : 0;
      const totalSecs = allRows.reduce((s, r) => s + r.time_spent_secs, 0);
      const statsResult = {
        enrolled,
        completed,
        avgProgress: avg,
        totalHours: Math.max(0, Math.round(totalSecs / 3600)),
      };
      console.log("[fetchStats] returning statsResult:", statsResult);
      return statsResult;
    },
    { enrolled: 0, completed: 0, avgProgress: 0, totalHours: 0 },
    "fetchStats",
  );
}

export async function fetchContinueLesson(userId: string): Promise<ContinueLesson | null> {
  return safe(
    async () => {
      // 1. Scan localStorage for latest demo progress
      let latestDemo: ContinueLesson | null = null;
      let latestDemoTime = 0;
      try {
        const prefix = `demo_progress_${userId}_`;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key?.startsWith(prefix)) continue;
          const courseId = key.replace(prefix, "");
          const map: Record<string, any> = JSON.parse(localStorage.getItem(key) || "{}");
          for (const [lessonId, item] of Object.entries(map)) {
            if (!item?.last_watched_at || item.is_completed) continue;
            const t = new Date(item.last_watched_at).getTime();
            if (t > latestDemoTime) {
              latestDemoTime = t;
              const course = FALLBACK.find((c) => c.id === courseId);
              const allLessons = DEMO_MODULES.flatMap((m) => m.lessons);
              const lesson = allLessons.find((l) => l.id === lessonId);
              if (course && lesson) {
                const totalLessons = allLessons.length;
                const completedLessons = Object.values(map).filter(
                  (l: any) => l.is_completed,
                ).length;
                latestDemo = {
                  course_id: courseId,
                  course_title: course.title,
                  course_thumbnail: course.thumbnail_url ?? null,
                  lesson_id: lessonId,
                  lesson_title: lesson.title,
                  progress: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
                  last_watched_at: item.last_watched_at,
                };
              }
            }
          }
        }
      } catch {}

      // 2. Fetch latest real progress from Supabase - use separate queries to avoid FK join issues
      const { data: lpData } = await supabase
        .from("lesson_progress")
        .select("lesson_id, course_id, watch_percentage, last_watched_at")
        .eq("user_id", userId)
        .eq("is_completed", false)
        .order("last_watched_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let latestReal: ContinueLesson | null = null;
      let latestRealTime = 0;
      if (lpData) {
        const d = lpData as any;
        const courseIdStr = String(d.course_id);
        const lessonIdNum = Number(d.lesson_id);

        // Fetch course and lesson info with separate queries
        const [{ data: courseData }, { data: lessonData }] = await Promise.all([
          supabase.from("courses").select("title, thumbnail_url").eq("id", courseIdStr).maybeSingle(),
          supabase.from("lessons").select("title").eq("id", lessonIdNum).maybeSingle(),
        ]);

        // Compute progress inline using fetchCourseProgressMap
        const progressMap = await fetchCourseProgressMap(userId, courseIdStr);
        const completedCount = Object.values(progressMap).filter((r: any) => r.is_completed).length;
        // Get total from modules/lessons
        const { data: mods } = await supabase.from("modules").select("id").eq("course_id", courseIdStr);
        const modIds = (mods ?? []).map((m: any) => m.id);
        let percentage = 0;
        if (modIds.length > 0) {
          const { data: lsns } = await supabase.from("lessons").select("id").in("module_id", modIds);
          const total = (lsns ?? []).length;
          percentage = total ? Math.round((completedCount / total) * 100) : 0;
        }
        latestRealTime = d.last_watched_at ? new Date(d.last_watched_at).getTime() : 0;

        latestReal = {
          course_id: courseIdStr,
          course_title: (courseData as any)?.title ?? "Untitled Course",
          course_thumbnail: (courseData as any)?.thumbnail_url ?? null,
          lesson_id: String(d.lesson_id),
          lesson_title: (lessonData as any)?.title ?? "Untitled Lesson",
          progress: percentage,
          last_watched_at: d.last_watched_at,
        };
      }

      // 3. Return the more recent progress
      if (latestReal && latestRealTime >= latestDemoTime) {
        return latestReal;
      }
      return latestDemo;
    },
    null,
    "fetchContinueLesson",
  );
}

export async function fetchRecommended(): Promise<CourseCard[]> {
  return safe(
    async () => {
      const { data } = await supabase
        .from("courses")
        .select(
          "id, title, category, level, price, original_price, is_free, thumbnail_url, rating, total_reviews",
        )
        .order("rating", { ascending: false })
        .limit(8);
      // FALLBACK used here: if Supabase has no courses yet, show the 8 demo courses
      // so the Dashboard "Recommended" section is never empty during development.
      if (data && (data as any[]).length > 0) return data as CourseCard[];
      return FALLBACK.slice(0, 8) as unknown as CourseCard[];
    },
    FALLBACK.slice(0, 8) as unknown as CourseCard[],
    "fetchRecommended",
  );
}

export async function fetchWeeklyActivity(userId: string): Promise<WeeklyPoint[]> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date();
  const days: WeeklyPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: dateStr,
      count: 0,
      isToday: dateStr === todayStr,
    });
  }
  return safe(
    async () => {
      const since = new Date(today);
      since.setDate(today.getDate() - 6);
      since.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("lesson_progress")
        .select("last_watched_at")
        .eq("user_id", userId)
        .gte("last_watched_at", since.toISOString());
      const rows = (data as Array<{ last_watched_at: string | null }>) ?? [];

      // Also include demo progress rows from localStorage
      const demoRows: Array<{ last_watched_at: string | null }> = [];
      try {
        const prefix = `demo_progress_${userId}_`;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(prefix)) {
            const map = JSON.parse(localStorage.getItem(key) || "{}");
            for (const item of Object.values(map) as any[]) {
              if (item?.last_watched_at && new Date(item.last_watched_at) >= since) {
                demoRows.push({ last_watched_at: item.last_watched_at });
              }
            }
          }
        }
      } catch {}

      for (const r of [...rows, ...demoRows]) {
        if (!r.last_watched_at) continue;
        const target = days.find((d) => d.date === r.last_watched_at!.slice(0, 10));
        if (target) target.count += 1;
      }
      return days;
    },
    days,
    "fetchWeeklyActivity",
  );
}

export function fetchAchievements(stats: DashboardStats, streak: StreakInfo): Achievement[] {
  return [
    {
      id: "first_lesson",
      label: "First Step",
      icon: "🚀",
      unlocked: stats.enrolled >= 1,
      description: "Enrolled in your first course",
    },
    {
      id: "streak_3",
      label: "On Fire",
      icon: "🔥",
      unlocked: streak.current_streak >= 3,
      description: "3-day learning streak",
    },
    {
      id: "streak_7",
      label: "Week Warrior",
      icon: "⚡",
      unlocked: streak.current_streak >= 7,
      description: "7-day learning streak",
    },
    {
      id: "completed_1",
      label: "Graduate",
      icon: "🎓",
      unlocked: stats.completed >= 1,
      description: "Completed a course",
    },
    {
      id: "hours_5",
      label: "Dedicated",
      icon: "⏱",
      unlocked: stats.totalHours >= 5,
      description: "5+ hours of learning",
    },
    {
      id: "enrolled_3",
      label: "Explorer",
      icon: "🧭",
      unlocked: stats.enrolled >= 3,
      description: "Enrolled in 3+ courses",
    },
  ];
}

// ── Demo fallbacks (used when Supabase data is absent / during development) ──
export const DEMO_STATS: DashboardStats = {
  enrolled: 4,
  completed: 1,
  avgProgress: 62,
  totalHours: 8,
};
export const DEMO_STREAK: StreakInfo = { current_streak: 7, longest_streak: 14 };
export const DEMO_CONTINUE: ContinueLesson = {
  course_id: "demo-1",
  course_title: "Build Your First Robot with Arduino",
  course_thumbnail: null,
  lesson_id: "l7",
  lesson_title: "Project: Mini Robot Build",
  progress: 64,
  last_watched_at: new Date().toISOString(),
};
export const DEMO_WEEKLY: WeeklyPoint[] = (() => {
  const out: WeeklyPoint[] = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const sample = [2, 4, 1, 5, 3, 6, 4];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    out.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: dateStr,
      count: sample[6 - i],
      isToday: dateStr === todayStr,
    });
  }
  return out;
})();
