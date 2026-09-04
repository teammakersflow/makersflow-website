import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "./auth/apiClient";
import { courseService } from "./courseService";
import { enrollmentService } from "./enrollmentService";
import { progressService } from "./progressService";
import type { BackendUser } from "./auth/customAuthService";
import { tokenStorage } from "./auth/tokenStorage";
import { fetchCourseProgressMap } from "./learn-data";
// FALLBACK: CourseCard[] — demo courses used in two places:
//   1. fetchContinueLesson: looks up title/thumbnail for demo progress stored in localStorage
//   2. fetchRecommended: returned as fallback when Supabase courses table is empty
// DEMO_MODULES: Module[] — used in fetchContinueLesson to find the next incomplete lesson
//   by iterating module/lesson structure for demo-* course IDs.
// Both exports exist in ./explore-data — import is valid.
import { DEMO_MODULES } from "./explore-data";
import type { CourseCard } from "./landing-data";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
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
  rawHours?: number;
  totalSecs?: number;
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
      // 1. If requesting current user's profile and cached, use fast cache
      const cached = tokenStorage.getUser();
      if (cached && cached.id === userId) {
        return {
          id: cached.id,
          full_name: (cached.full_name ?? cached.name ?? null) as string | null,
          email: cached.email ?? null,
          phone: (cached.phone ?? null) as string | null,
          avatar_url: (cached.avatar_url ?? cached.profileImage ?? null) as string | null,
          grade: (cached.grade ?? null) as string | null,
          school: (cached.school ?? null) as string | null,
          role: cached.role ?? null,
        };
      }

      // 2. Fetch user profile from NestJS backend: GET /users/:id
      const res = await apiClient.get<BackendUser>(`/users/${userId}`);
      if (res.data) {
        const u = res.data;
        return {
          id: u.id,
          full_name: (u.full_name ?? u.name ?? null) as string | null,
          email: u.email ?? null,
          phone: (u.phone ?? null) as string | null,
          avatar_url: (u.avatar_url ?? u.profileImage ?? null) as string | null,
          grade: (u.grade ?? null) as string | null,
          school: (u.school ?? null) as string | null,
          role: u.role ?? null,
        };
      }
      return null;
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
      const [enrList, { data: pur }] = await Promise.all([
        enrollmentService.getMyEnrollments(),
        supabase
          .from("course_purchases")
          .select("id, course_id, status")
          .eq("user_id", userId)
          .eq("status", "active"),
      ]);

      const enrRows =
        (enrList as Array<{
          id: string;
          course_id: string | number;
          completed_at?: string | null;
        }>) ?? [];
      const purRows = (pur as Array<{ id: string; course_id: string | number }>) ?? [];

      // Combine unique course IDs from enrollments and course_purchases
      const courseMap = new Map<string, { course_id: string | number; completed_at?: string | null }>();
      for (const r of enrRows) {
        if (r?.course_id) courseMap.set(String(r.course_id), r);
      }
      for (const r of purRows) {
        if (r?.course_id && !courseMap.has(String(r.course_id))) {
          courseMap.set(String(r.course_id), { course_id: r.course_id, completed_at: null });
        }
      }

      // Fetch progress for each unique course via progressService
      const courseProgressPromises = Array.from(courseMap.keys()).map((cId) =>
        progressService.getCourseProgress(cId),
      );
      const courseProgressResults = await Promise.all(courseProgressPromises);
      const courseProgressMap = new Map<string, any>();
      courseProgressResults.forEach((cp) => {
        if (cp?.courseId) courseProgressMap.set(cp.courseId, cp);
      });

      // ── Accurate Learned Time Calculation ──────────────────────────
      const lpRows = courseProgressResults.flatMap((cp) => cp?.lessonsProgress ?? []);

      // Extract demo progress rows from localStorage
      const demoLpRows: Array<{
        lesson_id: string;
        time_spent_secs?: number | null;
        watch_percentage?: number | null;
        is_completed?: boolean | null;
      }> = [];

      try {
        const prefix = `demo_progress_${userId}_`;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            const map = JSON.parse(localStorage.getItem(key) || "{}");
            for (const item of Object.values(map) as any[]) {
              if (item) {
                demoLpRows.push({
                  lesson_id: item.lesson_id,
                  time_spent_secs: item.time_spent_secs ?? 0,
                  watch_percentage: item.watch_percentage ?? 0,
                  is_completed: item.is_completed ?? false,
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn("[makersflow] Error reading demo progress for stats:", err);
      }

      const dbLessonIds = lpRows
        .map((r) => String(r.lesson_id))
        .filter((id) => id && id !== "0");

      const lessonDurationsMap = await courseService.getLessonDurationsMap(dbLessonIds);

      let totalSecs = 0;
      for (const r of lpRows) {
        const spent = Number(r.time_spent_secs) || 0;
        const dbDur = lessonDurationsMap.get(String(r.lesson_id)) ?? 0;
        const durSecs = dbDur > 0 ? dbDur : (spent > 0 ? spent : 180);
        const pct = Number(r.watch_percentage) || 0;

        if (r.is_completed || pct >= 80) {
          totalSecs += durSecs;
        } else {
          const pctSecs = durSecs > 0 ? Math.round((pct / 100) * durSecs) : spent;
          totalSecs += Math.max(spent, pctSecs);
        }
      }

      const demoLessonsFlat = DEMO_MODULES.flatMap((m) => m.lessons ?? []);
      for (const r of demoLpRows) {
        const demoL = demoLessonsFlat.find((dl) => dl.id === r.lesson_id);
        const durSecs = (demoL?.duration_minutes ?? 10) * 60;
        const pct = Number(r.watch_percentage) || 0;
        const spent = Number(r.time_spent_secs) || 0;

        if (r.is_completed || pct >= 80) {
          totalSecs += durSecs;
        } else {
          const pctSecs = Math.round((pct / 100) * durSecs);
          totalSecs += Math.max(spent, pctSecs);
        }
      }

      const totalMinutes = Math.round(totalSecs / 60);
      const timeUnit: "h" | "m" = totalSecs < 3600 ? "m" : "h";
      const displayVal = totalSecs < 3600 ? totalMinutes : Math.round((totalSecs / 3600) * 10) / 10;
      const formattedTime = totalSecs < 3600 ? `${totalMinutes}m` : `${displayVal}h`;
      const rawHours = Math.round((totalSecs / 3600) * 10) / 10;
      const totalHours = totalSecs < 3600 ? totalMinutes : rawHours;

      if (courseMap.size === 0 && demoLpRows.length === 0) {
        return { enrolled: 0, completed: 0, avgProgress: 0, totalHours, rawHours, totalSecs, formattedTime, timeUnit };
      }

      const rows = [];
      for (const r of enrRows) {
        if (!r?.course_id) continue;
        const courseIdStr = String(r.course_id);
        const cp = courseProgressMap.get(courseIdStr);
        const percentage = cp?.completionPercentage ?? 0;
        rows.push({
          progress: percentage,
          completed_at: r.completed_at ?? null,
          status: r.completed_at || percentage >= 100 ? "completed" : "active",
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
        rawHours,
        totalSecs,
        formattedTime,
        timeUnit,
      };
      return statsResult;
    },
    { enrolled: 0, completed: 0, avgProgress: 0, totalHours: 0, rawHours: 0, totalSecs: 0, formattedTime: "0m", timeUnit: "m" },
    "fetchStats",
  );
}

export async function fetchContinueLesson(userId: string): Promise<ContinueLesson | null> {
  return safe(
    async () => {
      // 1. First check if user has enrolled courses via enrollmentService
      const enrollments = await enrollmentService.getMyEnrollments();
      if (!enrollments || enrollments.length === 0) return null;

      // 2. Fetch course progress for enrolled courses
      const progressPromises = enrollments.map((e) =>
        progressService.getCourseProgress(e.course_id),
      );
      const progressResults = await Promise.all(progressPromises);

      // Find the most recently accessed/watched incomplete lesson across all courses
      let latestIncompleteLesson: {
        courseId: string;
        lessonId: string;
        watchPercentage: number;
        lastWatchedAt: string | null;
      } | null = null;

      let latestTimestamp = 0;

      for (const cp of progressResults) {
        if (!cp) continue;
        for (const lp of cp.lessonsProgress) {
          if (!lp.is_completed) {
            const time = lp.last_watched_at ? new Date(lp.last_watched_at).getTime() : 0;
            if (time > latestTimestamp) {
              latestTimestamp = time;
              latestIncompleteLesson = {
                courseId: cp.courseId,
                lessonId: lp.lesson_id,
                watchPercentage: lp.watch_percentage,
                lastWatchedAt: lp.last_watched_at,
              };
            }
          }
        }
      }

      // If no watched incomplete lesson was found, pick the first incomplete lesson from the first enrolled course
      if (!latestIncompleteLesson && progressResults.length > 0) {
        for (const cp of progressResults) {
          if (!cp) continue;
          if (cp.completionPercentage < 100) {
            const completedSet = new Set(cp.completedLessonIds);
            const curriculum = await courseService.getCourseCurriculum(cp.courseId);
            const allLessons = curriculum.flatMap((m) => m.lessons);
            const nextLesson = allLessons.find((l) => !completedSet.has(String(l.id)));
            if (nextLesson) {
              latestIncompleteLesson = {
                courseId: cp.courseId,
                lessonId: String(nextLesson.id),
                watchPercentage: 0,
                lastWatchedAt: null,
              };
              break;
            }
          }
        }
      }

      if (!latestIncompleteLesson) return null;

      const courseIdStr = latestIncompleteLesson.courseId;
      const lessonIdStr = latestIncompleteLesson.lessonId;

      // Fetch course and lesson info via courseService
      const [courseData, lessonData, cp] = await Promise.all([
        courseService.getCourseById(courseIdStr),
        courseService.getLessonById(lessonIdStr),
        progressService.getCourseProgress(courseIdStr),
      ]);

      const percentage = cp?.completionPercentage ?? 0;

      return {
        course_id: courseIdStr,
        course_title: courseData?.title ?? "Untitled Course",
        course_thumbnail: courseData?.thumbnail_url ?? null,
        lesson_id: String(lessonIdStr),
        lesson_title: lessonData?.title ?? "Untitled Lesson",
        progress: percentage,
        last_watched_at: latestIncompleteLesson.lastWatchedAt,
      };
    },
    null,
    "fetchContinueLesson",
  );
}

export async function fetchRecommended(): Promise<CourseCard[]> {
  return safe(
    async () => {
      const courses = await courseService.getCourses();
      const published = courses.filter((c) => c.is_published !== false);
      published.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      return published.slice(0, 8).map((c) => ({
        id: String(c.id),
        title: c.title,
        category: c.category,
        level: c.level,
        price: c.price,
        original_price: null,
        gst_rate: c.gst_rate ?? 18,
        is_free: c.is_free,
        thumbnail_url: c.thumbnail_url,
        rating: null,
        total_reviews: null,
        instructor_name: null,
      }));
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

      const enrollments = await enrollmentService.getMyEnrollments();
      const courseProgressPromises = enrollments.map((e) =>
        progressService.getCourseProgress(e.course_id),
      );
      const courseProgressResults = await Promise.all(courseProgressPromises);
      const rows = courseProgressResults
        .flatMap((cp) => cp?.lessonsProgress ?? [])
        .filter((p) => p.last_watched_at && new Date(p.last_watched_at) >= since);

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
  const safeStats = stats ?? { enrolled: 0, completed: 0, avgProgress: 0, totalHours: 0, rawHours: 0, totalSecs: 0 };
  const safeStreak = streak ?? { current_streak: 0, longest_streak: 0 };
  const maxStreak = Math.max(safeStreak.current_streak ?? 0, safeStreak.longest_streak ?? 0);
  const actualHours = safeStats.rawHours ?? (safeStats.totalSecs ? safeStats.totalSecs / 3600 : 0);

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
      unlocked: (safeStats.totalSecs ?? 0) > 0 || (safeStats.completed ?? 0) >= 1,
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
      unlocked: actualHours >= 5,
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
