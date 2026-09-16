import { apiClient } from "@/lib/auth/apiClient";
import { courseService } from "@/lib/courseService";
import { enrollmentService } from "./enrollmentService";
import { progressService } from "./progressService";
import { fetchMyCertificates } from "./certificates";
import { FALLBACK, DEMO_MODULES, resolveCourseId, type Module } from "./explore-data";
import {
  mapDbLessonToDetail,
  mapDbLessonResource,
  mapDbLessonProgress,
  type RawDbLessonProgress,
} from "./db-mappers";

export type LessonDetail = {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  video_url: string | null;
  content: string | null;
  notes: string | null;
  duration_minutes: number | null;
  position: number;
};

export type LessonResource = {
  id: string;
  title: string;
  url: string;
  type: string | null;
  size_bytes: number | null;
};

export type LessonProgressRow = {
  lesson_id: string;
  course_id: string;
  current_time_secs: number;
  watch_percentage: number;
  time_spent_secs: number;
  is_completed: boolean;
  last_watched_at: string | null;
};

export async function fetchSignedVideoUrl(
  lessonId: string | number,
  _userId?: string,
): Promise<string | null> {
  try {
    const res = await apiClient.get<{ signedUrl: string; expiresIn: number }>(
      `/lessons/${lessonId}/video`,
    );
    const url = res?.data?.signedUrl ?? null;
    if (!url) {
      console.warn("[fetchSignedVideoUrl] NestJS returned no signedUrl for lesson", lessonId);
      return null;
    }
    return url;
  } catch (err: any) {
    // 401 → token expired (apiClient auto-refreshes; if it reaches here, session is gone)
    // 403 → not enrolled / access denied → do NOT fall back to raw URL
    // 404 → lesson has no video
    console.warn("[fetchSignedVideoUrl] NestJS /lessons/:id/video failed:", err?.message ?? err);
    return null;
  }
}

export async function fetchLesson(courseId: string, lessonId: string): Promise<LessonDetail> {
  // Demo/fallback courses (used whenever Supabase has no matching row) store
  // their lessons as static data with non-numeric ids like "l1". Number(lessonId)
  // would be NaN against the real `lessons` table, so this path always failed
  // with "Lesson not found" — that's the bug behind "Continue Learning".
  if (courseId.startsWith("demo-")) {
    const allLessons = DEMO_MODULES.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, module_id: m.id })),
    );
    const lesson = allLessons.find((l) => l.id === lessonId);
    if (!lesson) throw new Error(`Lesson ${lessonId} not found`);
    return {
      id: lesson.id,
      course_id: courseId,
      module_id: lesson.module_id,
      title: lesson.title,
      description: null,
      video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
      content:
        "This is a demo lesson. Connect a real course in Supabase to replace this placeholder content.",
      notes: null,
      duration_minutes: lesson.duration_minutes,
      position: lesson.position,
    };
  }

  const data = await courseService.getLessonById(lessonId);

  if (!data) {
    throw new Error(`Lesson ${lessonId} not found`);
  }

  const mapped = mapDbLessonToDetail(data, courseId);
  // Attempt to fetch signed video URL via Edge Function for server-gated playback
  if (mapped.video_url) {
    const signed = await fetchSignedVideoUrl(data.id);
    if (signed) {
      mapped.video_url = signed;
    }
  }

  return mapped;
}

export async function fetchLessonResources(lessonId: string): Promise<LessonResource[]> {
  if (!lessonId || isNaN(Number(lessonId))) {
    return [];
  }
  try {
    const res = await apiClient.get<any[]>(`/lesson-resources/lesson/${lessonId}`);
    const items = res.data ?? (Array.isArray(res) ? res : []);
    if (Array.isArray(items)) {
      return items.map((r) => mapDbLessonResource(r));
    }
  } catch (err: any) {
    if (err?.status === 403 || err?.statusCode === 403) {
      // User is not enrolled in this course / non-preview lesson
      return [];
    }
    console.warn(`[makersflow] fetchLessonResources error:`, err?.message || err);
  }
  return [];
}

export async function fetchCourseProgressMap(
  userId: string,
  courseId: string,
): Promise<Record<string, LessonProgressRow>> {
  if (courseId.startsWith("demo-")) {
    try {
      const key = `demo_progress_${userId}_${courseId}`;
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch (err) {
      console.warn("Failed to read demo progress from local storage:", err);
      return {};
    }
  }
  try {
    const cp = await progressService.getCourseProgress(courseId);
    if (!cp) return {};

    const map: Record<string, LessonProgressRow> = {};
    for (const p of cp.lessonsProgress) {
      map[p.lesson_id] = {
        lesson_id: p.lesson_id,
        course_id: cp.courseId,
        current_time_secs: p.current_time_secs,
        watch_percentage: p.watch_percentage,
        time_spent_secs: p.time_spent_secs,
        is_completed: p.is_completed,
        last_watched_at: p.last_watched_at,
      };
    }
    return map;
  } catch (err) {
    console.warn(`[makersflow] fetchCourseProgressMap threw:`, err);
    return {};
  }
}

export async function upsertLessonProgress(
  userId: string,
  payload: {
    lesson_id: string;
    course_id: string;
    current_time_secs: number;
    watch_percentage: number;
    time_spent_secs: number;
    is_completed?: boolean;
  },
) {
  if (payload.course_id.startsWith("demo-")) {
    try {
      const key = `demo_progress_${userId}_${payload.course_id}`;
      const current = JSON.parse(localStorage.getItem(key) || "{}");
      current[payload.lesson_id] = {
        lesson_id: payload.lesson_id,
        course_id: payload.course_id,
        current_time_secs: Math.round(payload.current_time_secs),
        watch_percentage: Math.round(payload.watch_percentage),
        time_spent_secs: Math.round(payload.time_spent_secs),
        is_completed: payload.is_completed ?? false,
        last_watched_at: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(current));
    } catch (err) {
      console.warn("Failed to save demo lesson progress to local storage:", err);
    }
    return;
  }
  try {
    await progressService.syncLessonProgress({
      course_id: payload.course_id,
      lesson_id: payload.lesson_id,
      watch_percentage: payload.watch_percentage,
      current_time_secs: payload.current_time_secs,
      is_completed: payload.is_completed,
      time_spent_secs: payload.time_spent_secs,
    });
  } catch (err) {
    console.warn(`[makersflow] upsertLessonProgress threw:`, err);
    throw err;
  }
}

export async function markLessonComplete(userId: string, courseId: string, lessonId: string) {
  if (courseId.startsWith("demo-")) {
    try {
      const key = `demo_progress_${userId}_${courseId}`;
      const current = JSON.parse(localStorage.getItem(key) || "{}");
      current[lessonId] = {
        lesson_id: lessonId,
        course_id: courseId,
        current_time_secs: 0,
        watch_percentage: 100,
        time_spent_secs: 0,
        is_completed: true,
        last_watched_at: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(current));
    } catch (err) {
      console.warn("Failed to save demo lesson complete to local storage:", err);
    }
    return;
  }
  try {
    await progressService.markLessonComplete(courseId, lessonId);
  } catch (err) {
    console.warn(`[makersflow] markLessonComplete threw:`, err);
    throw err;
  }
}

export type EnrolledCourse = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  category: string | null;
  level: string | null;
  total_lessons: number;
  completed_lessons: number;
  progress: number; // 0..100
  next_lesson_id: string | null;
  enrolled_at: string | null;
  completed_at: string | null;
  certificate_id?: string | null;
};

function flattenLessons(modules: Module[]) {
  return modules.flatMap((m) =>
    m.lessons
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((l) => ({ ...l, module_position: m.position })),
  );
}

export async function fetchEnrolledCourses(userId: string): Promise<EnrolledCourse[]> {
  console.log("[fetchEnrolledCourses] Fetching enrolled courses for user:", userId);

  const out: EnrolledCourse[] = [];

  // ── Demo/fallback course enrollments (stored client-side in localStorage,
  // since there's no Supabase row to attach a real `enrollments` record to) ──
  try {
    const demoIds: string[] = JSON.parse(
      localStorage.getItem(`demo_enrollments_${userId}`) || "[]",
    );
    for (const courseId of demoIds) {
      const course = FALLBACK.find((c) => c.id === courseId);
      if (!course) continue;
      const flat = flattenLessons(DEMO_MODULES);
      const progressMap = await fetchCourseProgressMap(userId, courseId);
      const completed = flat.filter((l) => progressMap[l.id]?.is_completed).length;
      const total = flat.length;
      const next = flat.find((l) => !progressMap[l.id]?.is_completed) ?? flat[0];
      out.push({
        id: courseId,
        title: course.title,
        thumbnail_url: course.thumbnail_url ?? null,
        category: course.category ?? null,
        level: course.level ?? null,
        total_lessons: total,
        completed_lessons: completed,
        progress: total ? Math.round((completed / total) * 100) : 0,
        next_lesson_id: next?.id ?? null,
        enrolled_at: null,
        completed_at: completed === total && total > 0 ? new Date().toISOString() : null,
      });
    }
  } catch (err) {
    console.warn("[fetchEnrolledCourses] Failed to read demo enrollments:", err);
  }

  try {
    // Query certificates for user: Authoritative NestJS GET /certificates/me
    const certMap = new Map<string, string>();
    try {
      const myCerts = await fetchMyCertificates();
      if (myCerts && myCerts.length > 0) {
        myCerts.forEach((c) => {
          if (c.course_id && c.id) certMap.set(String(c.course_id), c.id);
        });
      }
    } catch {
      // Best effort
    }

    // Query enrollments with course data joined via enrollmentService
    const enrollments = await enrollmentService.getMyEnrollments();

    console.log("[fetchEnrolledCourses] Enrollments response count:", enrollments?.length ?? 0);

    if (!enrollments || enrollments.length === 0) {
      console.log("[fetchEnrolledCourses] No real-course enrollments found");
      return out;
    }

    for (const enrollment of enrollments) {
      const courseData = (enrollment as any).courses;
      const courseId = String((enrollment as any).course_id);

      // Skip if course data is missing
      if (!courseData) {
        console.warn(`[fetchEnrolledCourses] No course data for enrollment:`, courseId);
        continue;
      }

      console.log(`[fetchEnrolledCourses] Processing course: ${courseId}`);

      // Fetch modules and lessons for this course via courseService
      let modules: any[] = [];

      const targetCourseId = await resolveCourseId(courseId);
      try {
        const curriculum = await courseService.getCourseCurriculum(targetCourseId);
        modules = curriculum.map((module) => ({
          id: String(module.id),
          title: module.title,
          position: module.position,
          lessons: module.lessons.map((l) => ({
            id: String(l.id),
            title: l.title,
            duration_minutes: l.duration_minutes,
            position: l.position,
          })),
        }));
      } catch (err) {
        console.warn(`[fetchEnrolledCourses] Could not load curriculum for ${courseId}:`, err);
        modules = [];
      }

      const flat = flattenLessons(modules);
      const progressMap = await fetchCourseProgressMap(userId, courseId);
      const completed = flat.filter((l) => progressMap[l.id]?.is_completed).length;
      const total = flat.length;
      const next = flat.find((l) => !progressMap[l.id]?.is_completed) ?? flat[0];

      console.log(
        `[fetchEnrolledCourses] Course ${courseId} progress: ${completed}/${total} lessons`,
      );

      let certId = certMap.get(String(courseData.id ?? courseId)) ?? null;
      if (!certId && ((completed === total && total > 0) || (enrollment as any).completed_at)) {
        // Automatically issue certificate row if course is completed
        try {
          const { getOrCreateCertificate } = await import("./certificates");
          const createdCert = await getOrCreateCertificate(userId, courseId);
          if (createdCert) certId = createdCert.id;
        } catch {
          // Non-blocking fallback
        }
      }

      out.push({
        id: String(courseData.id ?? courseId),
        title: courseData.title ?? "Untitled Course",
        thumbnail_url: courseData.thumbnail_url ?? null,
        category: courseData.category ?? null,
        level: courseData.level ?? null,
        total_lessons: total,
        completed_lessons: completed,
        progress: total ? Math.round((completed / total) * 100) : 0,
        next_lesson_id: next?.id ?? null,
        enrolled_at: (enrollment as any).enrolled_at,
        completed_at: (enrollment as any).completed_at,
        certificate_id: certId,
      });
    }

    console.log("[fetchEnrolledCourses] Final result:", out.length, "courses");
    return out;
  } catch (err) {
    console.error(`[fetchEnrolledCourses] Exception:`, err);
    return out;
  }
}

export type StreakDay = { date: string; count: number };

export type ProgressOverview = {
  total_enrolled: number;
  total_completed: number;
  total_hours: number;
  /** Same figure in whole minutes \u2014 lets the UI show "7m" instead of rounding to 0h. */
  total_minutes: number;
  current_streak: number;
  longest_streak: number;
  activity: StreakDay[]; // last 365 days
  weekly: { day: string; date: string; count: number }[]; // last 7 days
};

export async function fetchProgressOverview(userId: string): Promise<ProgressOverview> {
  // baseline
  const activity: StreakDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    activity.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  const weekly: { day: string; date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    weekly.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.toISOString().slice(0, 10),
      count: 0,
    });
  }

  let totalEnrolled = 0;
  let totalCompleted = 0;
  let totalHours = 0;
  let totalMinutes = 0;
  let currentStreak = 0;
  let longestStreak = 0;

  try {
    const enr = await enrollmentService.getMyEnrollments();
    const erows = enr ?? [];

    // Add demo enrollments
    let demoEnrollments: string[] = [];
    try {
      demoEnrollments = JSON.parse(localStorage.getItem(`demo_enrollments_${userId}`) || "[]");
    } catch (err) {
      console.warn("[makersflow] Failed to parse demo_enrollments from localStorage:", err);
    }

    let demoCompletedCount = 0;
    for (const demoId of demoEnrollments) {
      const progressMap = await fetchCourseProgressMap(userId, demoId);
      const flat = flattenLessons(
        DEMO_MODULES.map((m) => ({
          id: m.id,
          title: m.title,
          position: m.position,
          lessons: (m.lessons ?? []).map((l: any) => ({
            id: l.id,
            title: l.title,
            duration_minutes: l.duration_minutes,
            position: l.position,
          })),
        })),
      );
      const completed = flat.filter((l) => progressMap[l.id]?.is_completed).length;
      if (flat.length > 0 && completed === flat.length) {
        demoCompletedCount++;
      }
    }

    totalEnrolled = erows.length + demoEnrollments.length;
    totalCompleted =
      erows.filter((r) => !!r.completed_at).length + demoCompletedCount;
  } catch (err) {
    console.warn(`[makersflow] fetchProgressOverview enrollments threw:`, err);
  }

  try {
    const myEnr = await enrollmentService.getMyEnrollments();
    const progressPromises = (myEnr ?? []).map((e) =>
      progressService.getCourseProgress(e.course_id),
    );
    const progressResults = await Promise.all(progressPromises);
    const prows = progressResults.flatMap((cp) => cp?.lessonsProgress ?? []);

    // Add demo progress records
    const demoProgressRows: Array<{
      lesson_id: string;
      time_spent_secs: number | null;
      watch_percentage: number | null;
      last_watched_at: string | null;
      is_completed: boolean | null;
    }> = [];
    try {
      const prefix = `demo_progress_${userId}_`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const map = JSON.parse(localStorage.getItem(key) || "{}");
          for (const item of Object.values(map) as any[]) {
            if (item) {
              demoProgressRows.push({
                lesson_id: item.lesson_id,
                time_spent_secs: item.time_spent_secs ?? 0,
                watch_percentage: item.watch_percentage ?? 0,
                last_watched_at: item.last_watched_at ?? null,
                is_completed: item.is_completed ?? false,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn("[makersflow] Failed to parse demo progress from localStorage:", err);
    }

    const dbLessonIds = prows
      .map((r) => String(r.lesson_id))
      .filter((id) => id && id !== "0");

    const lessonDurationsMap = await courseService.getLessonDurationsMap(dbLessonIds);

    let secs = 0;
    const byDay: Record<string, number> = {};

    for (const r of prows) {
      const spent = Number(r.time_spent_secs) || 0;
      const dbDur = lessonDurationsMap.get(String(r.lesson_id)) ?? 0;
      const durSecs = dbDur > 0 ? dbDur : (spent > 0 ? spent : 180);
      const pct = Number(r.watch_percentage) || 0;

      if (r.is_completed || pct >= 80) {
        secs += durSecs;
      } else {
        const pctSecs = durSecs > 0 ? Math.round((pct / 100) * durSecs) : spent;
        secs += Math.max(spent, pctSecs);
      }

      if (r.last_watched_at) {
        const key = r.last_watched_at.slice(0, 10);
        byDay[key] = (byDay[key] ?? 0) + 1;
      }
    }

    const demoLessonsFlat = DEMO_MODULES.flatMap((m) => m.lessons ?? []);
    for (const r of demoProgressRows) {
      const demoL = demoLessonsFlat.find((dl) => dl.id === r.lesson_id);
      const durSecs = (demoL?.duration_minutes ?? 10) * 60;
      const pct = Number(r.watch_percentage) || 0;
      const spent = Number(r.time_spent_secs) || 0;

      if (r.is_completed || pct >= 80) {
        secs += durSecs;
      } else {
        const pctSecs = Math.round((pct / 100) * durSecs);
        secs += Math.max(spent, pctSecs);
      }

      if (r.last_watched_at) {
        const key = r.last_watched_at.slice(0, 10);
        byDay[key] = (byDay[key] ?? 0) + 1;
      }
    }

    totalHours = Math.round((secs / 3600) * 10) / 10;
    totalMinutes = Math.round(secs / 60);
    for (const a of activity) a.count = byDay[a.date] ?? 0;
    for (const w of weekly) w.count = byDay[w.date] ?? 0;
  } catch (err) {
    console.warn(`[makersflow] fetchProgressOverview lesson_progress threw:`, err);
  }

  try {
    let streakRecord: any = null;
    try {
      const res = await apiClient.get<any>("/streaks/me");
      if (res.data) {
        streakRecord = res.data;
      } else if (res.data === null) {
        // Valid response: user has no streak row yet
        streakRecord = { current_streak: 0, longest_streak: 0, activity_log: [] };
      }
    } catch (streakErr) {
      console.warn(`[makersflow] fetchProgressOverview /streaks/me error:`, streakErr);
    }

    if (streakRecord) {
      const s = streakRecord as {
        current_streak?: number;
        longest_streak?: number;
        activity_log?: any;
      };
      currentStreak = s.current_streak ?? 0;
      longestStreak = s.longest_streak ?? 0;
      if (s.activity_log) {
        if (Array.isArray(s.activity_log)) {
          for (const dateItem of s.activity_log) {
            const dateObj = new Date(dateItem);
            if (!isNaN(dateObj.getTime())) {
              const dateKey = dateObj.toISOString().slice(0, 10);
              const matched = activity.find((a) => a.date === dateKey);
              if (matched && matched.count === 0) matched.count = 1;
              const matchedWeekly = weekly.find((w) => w.date === dateKey);
              if (matchedWeekly && matchedWeekly.count === 0) matchedWeekly.count = 1;
            }
          }
        } else if (typeof s.activity_log === "object") {
          for (const a of activity) {
            const v = (s.activity_log as Record<string, number>)[a.date];
            if (typeof v === "number" && v > a.count) a.count = v;
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[makersflow] fetchProgressOverview streaks threw:`, err);
  }

  return {
    total_enrolled: totalEnrolled,
    total_completed: totalCompleted,
    total_hours: totalHours,
    total_minutes: totalMinutes,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    activity,
    weekly,
  };
}
