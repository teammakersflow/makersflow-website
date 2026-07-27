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
  formattedTime?: string;
  timeUnit?: "h" | "m";
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
  return safe(
    async () => {
      const [{ data: enr }, { data: timeData }] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id, course_id, completed_at")
          .eq("user_id", userId),
        supabase
          .from("lesson_progress")
          .select("time_spent_secs")
          .eq("user_id", userId),
      ]);

      const enrRows =
        (enr as Array<{
          id: string;
          course_id: string | number;
          completed_at?: string | null;
        }>) ?? [];

      const totalSecs = (timeData ?? []).reduce(
        (sum: number, row: any) => sum + (Number(row?.time_spent_secs) || 0),
        0,
      );
      const timeUnit: "h" | "m" = totalSecs < 3600 ? "m" : "h";
      const displayVal =
        totalSecs < 3600
          ? Math.round(totalSecs / 60)
          : Math.round((totalSecs / 3600) * 10) / 10;
      const formattedTime = totalSecs < 3600 ? `${displayVal}m` : `${displayVal}h`;
      const totalHours = displayVal;

      if (enrRows.length === 0) {
        return { enrolled: 0, completed: 0, avgProgress: 0, totalHours, formattedTime, timeUnit };
      }

      const rows = [];
      for (const r of enrRows) {
        if (!r?.course_id) continue;
        const courseIdStr = String(r.course_id);
        // Get lesson IDs for this course
        const { data: modulesData } = await supabase
          .from("modules")
          .select("id")
          .eq("course_id", courseIdStr);
        const moduleIds = (modulesData ?? []).map((m: any) => m.id).filter(Boolean);
        let percentage = 0;
        if (moduleIds.length > 0) {
          const { data: lessonsData } = await supabase
            .from("lessons")
            .select("id")
            .in("module_id", moduleIds);
          const validIds = (lessonsData ?? [])
            .map((l: any) => l.id)
            .filter((id: any) => id !== null && id !== undefined);
          if (validIds.length > 0) {
            const { data: progressData } = await supabase
              .from("lesson_progress")
              .select("lesson_id, is_completed, watch_percentage")
              .eq("user_id", userId)
              .in("lesson_id", validIds);
            const pRows = progressData ?? [];
            const completedCount = pRows.filter((p: any) => p?.is_completed).length;
            percentage = validIds.length
              ? Math.round((completedCount / validIds.length) * 100)
              : 0;
          }
        }
        rows.push({
          progress: percentage,
          completed_at: r.completed_at ?? null,
          status: r.completed_at ? "completed" : "active",
        });
      }

      const enrolled = rows.length;
      const completed = rows.filter(
        (r) => r.completed_at || r.status === "completed" || r.progress >= 100,
      ).length;
      const avg = enrolled ? Math.round(rows.reduce((s, r) => s + r.progress, 0) / enrolled) : 0;
      const statsResult = {
        enrolled,
        completed,
        avgProgress: avg,
        totalHours,
        formattedTime,
        timeUnit,
      };
      return statsResult;
    },
    { enrolled: 0, completed: 0, avgProgress: 0, totalHours: 0, formattedTime: "0m", timeUnit: "m" },
    "fetchStats",
  );
}

export async function fetchContinueLesson(userId: string): Promise<ContinueLesson | null> {
  return safe(
    async () => {
      const { data: lpData } = await supabase
        .from("lesson_progress")
        .select("lesson_id, course_id, watch_percentage, last_watched_at")
        .eq("user_id", userId)
        .eq("is_completed", false)
        .order("last_watched_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lpData) return null;

      const d = lpData as any;
      const courseIdStr = String(d.course_id);
      const rawLessonId = d.lesson_id;

      if (!rawLessonId) return null;

      // Fetch course and lesson info with separate queries
      const [{ data: courseData }, { data: lessonData }] = await Promise.all([
        supabase
          .from("courses")
          .select("title, thumbnail_url")
          .eq("id", courseIdStr)
          .maybeSingle(),
        supabase.from("lessons").select("title").eq("id", rawLessonId).maybeSingle(),
      ]);

      // Compute progress inline using fetchCourseProgressMap
      const progressMap = await fetchCourseProgressMap(userId, courseIdStr);
      const completedCount = Object.values(progressMap ?? {}).filter((r: any) => r?.is_completed).length;
      // Get total from modules/lessons
      const { data: mods } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseIdStr);
      const modIds = (mods ?? []).map((m: any) => m.id).filter(Boolean);
      let percentage = 0;
      if (modIds.length > 0) {
        const { data: lsns } = await supabase
          .from("lessons")
          .select("id")
          .in("module_id", modIds);
        const total = (lsns ?? []).length;
        percentage = total ? Math.round((completedCount / total) * 100) : 0;
      }

      return {
        course_id: courseIdStr,
        course_title: (courseData as any)?.title ?? "Untitled Course",
        course_thumbnail: (courseData as any)?.thumbnail_url ?? null,
        lesson_id: String(rawLessonId),
        lesson_title: (lessonData as any)?.title ?? "Untitled Lesson",
        progress: percentage,
        last_watched_at: d.last_watched_at,
      };
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
        .select("id, title, category, level, price, is_free, thumbnail_url")
        .order("created_at", { ascending: false })
        .limit(8);
      if (data && (data as any[]).length > 0)
        return (data as any[]).map((c) => ({
          ...c,
          original_price: null,
          rating: null,
          total_reviews: null,
        })) as CourseCard[];
      return [];
    },
    [],
    "fetchRecommended",
  );
}

export async function fetchWeeklyActivity(userId: string): Promise<WeeklyPoint[]> {
  const today = new Date();
  const todayLocalStr = today.toLocaleDateString("en-CA");
  const days: WeeklyPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toLocaleDateString("en-CA");
    days.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: dateStr,
      count: 0,
      isToday: dateStr === todayLocalStr,
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

      for (const r of rows) {
        if (!r?.last_watched_at) continue;
        const rowLocalDate = new Date(r.last_watched_at).toLocaleDateString("en-CA");
        const target = days.find((d) => d.date === rowLocalDate);
        if (target) target.count += 1;
      }
      return days;
    },
    days,
    "fetchWeeklyActivity",
  );
}

export function fetchAchievements(stats: DashboardStats, streak: StreakInfo): Achievement[] {
  const safeStats = stats ?? { enrolled: 0, completed: 0, avgProgress: 0, totalHours: 0 };
  const safeStreak = streak ?? { current_streak: 0, longest_streak: 0 };
  const maxStreak = Math.max(safeStreak.current_streak ?? 0, safeStreak.longest_streak ?? 0);

  return [
    {
      id: "first_lesson",
      label: "First Step",
      icon: "🚀",
      unlocked: (safeStats.enrolled ?? 0) >= 1,
      description: "Enrolled in your first course",
    },
    {
      id: "first_study",
      label: "First Lesson",
      icon: "💡",
      unlocked: (safeStats.totalHours ?? 0) > 0 || (safeStats.completed ?? 0) >= 1,
      description: "Completed your first study session",
    },
    {
      id: "streak_3",
      label: "On Fire",
      icon: "🔥",
      unlocked: maxStreak >= 3,
      description: "3-day learning streak",
    },
    {
      id: "streak_7",
      label: "Week Warrior",
      icon: "⚡",
      unlocked: maxStreak >= 7,
      description: "7-day learning streak",
    },
    {
      id: "completed_1",
      label: "Graduate",
      icon: "🎓",
      unlocked: (safeStats.completed ?? 0) >= 1,
      description: "Completed a course",
    },
    {
      id: "hours_5",
      label: "Dedicated",
      icon: "⏱",
      unlocked: (safeStats.totalHours ?? 0) >= 5,
      description: "5+ hours of learning",
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
