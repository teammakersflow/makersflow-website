import { supabase } from "@/integrations/supabase/client";
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
  userId?: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("get-signed-video-url", {
      body: { lessonId, userId },
    });
    if (error) {
      console.warn("[fetchSignedVideoUrl] Edge Function error:", error);
      return null;
    }
    return (data?.signed_url as string) ?? (data?.video_url as string) ?? null;
  } catch (err) {
    console.warn("[fetchSignedVideoUrl] Exception:", err);
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

  const { data, error } = await supabase
    .from("lessons")
    .select("id, module_id, title, content, video_url, order_index, duration_secs, notes")
    .eq("id", Number(lessonId))
    .single();

  if (error) {
    console.error(`[makersflow] fetchLesson error:`, error);
    throw error;
  }

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
  try {
    const { data, error } = await supabase
      .from("lesson_resources")
      .select("id, title, url, type, size_bytes")
      .eq("lesson_id", lessonId);

    // Table doesn't exist yet (404) or other DB error — return empty, no noise
    if (error) {
      if (error.code !== "42P01") {
        // Only log if it's NOT a "table does not exist" error
        console.warn(`[makersflow] fetchLessonResources error:`, error.message);
      }
      return [];
    }

    if (data && data.length) return data.map((r) => mapDbLessonResource(r));
  } catch (err) {
    console.warn(`[makersflow] fetchLessonResources threw:`, err);
  }
  // No resources found — return empty array (no fake placeholder resources)
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
    const targetCourseId = await resolveCourseId(courseId);
    const { data } = await supabase
      .from("lesson_progress")
      .select(
        "lesson_id, course_id, current_time_secs, watch_percentage, time_spent_secs, is_completed, last_watched_at",
      )
      .eq("user_id", userId)
      .eq("course_id", targetCourseId);
    const map: Record<string, LessonProgressRow> = {};
    for (const row of (data ?? []) as RawDbLessonProgress[]) {
      const mapped = mapDbLessonProgress(row);
      map[mapped.lesson_id] = mapped;
    }
    return map;
  } catch (err) {
    console.warn(`[makersflow] fetchCourseProgressMap lesson_progress threw, using fallback:`, err);
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
    const progressPayload = {
      user_id: userId,
      lesson_id: Number(payload.lesson_id),
      course_id: payload.course_id,
      watch_percentage: Math.round(payload.watch_percentage),
      current_time_secs: Math.floor(payload.current_time_secs),
      is_completed: payload.is_completed ?? false,
      time_spent_secs: Math.floor(payload.time_spent_secs),
      last_watched_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(progressPayload, { onConflict: "user_id,course_id,lesson_id" });
    if (error) {
      console.error(`[makersflow] upsertLessonProgress upsert failed:`, error);
      throw error;
    }
  } catch (err) {
    console.warn(`[makersflow] upsertLessonProgress lesson_progress threw:`, err);
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
    const targetCourseId = await resolveCourseId(courseId);
    const lessonNum = Number(lessonId);
    const { data: existing } = await supabase
      .from("lesson_progress")
      .select("id, time_spent_secs")
      .eq("user_id", userId)
      .eq("course_id", targetCourseId)
      .eq("lesson_id", lessonNum)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("lesson_progress")
        .update({
          is_completed: true,
          watch_percentage: 100,
          last_watched_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) {
        console.error(`[makersflow] markLessonComplete update failed:`, error);
        throw error;
      }
    } else {
      const { error } = await supabase.from("lesson_progress").insert({
        user_id: userId,
        lesson_id: lessonNum,
        course_id: courseId,
        is_completed: true,
        watch_percentage: 100,
        time_spent_secs: 0,
        last_watched_at: new Date().toISOString(),
      });
      if (error) {
        console.error(`[makersflow] markLessonComplete insert failed:`, error);
        throw error;
      }
    }
  } catch (err) {
    console.warn(`[makersflow] markLessonComplete lesson_progress threw:`, err);
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
    // Query certificates for user
    const { data: certs } = await supabase
      .from("certificates")
      .select("id, course_id")
      .eq("user_id", userId);
    const certMap = new Map<string, string>();
    certs?.forEach((c: any) => { if (c.course_id && c.id) certMap.set(String(c.course_id), c.id); });

    // Query enrollments with course data joined
    const { data: enrollments, error: enrError } = await supabase
      .from("enrollments")
      .select(
        `
        course_id,
        enrolled_at,
        completed_at,
        courses (
          id,
          title,
          category,
          level,
          thumbnail_url,
          is_free,
          price,
          slug
        )
      `,
      )
      .eq("user_id", userId);

    console.log("[fetchEnrolledCourses] Enrollments query response:", {
      count: enrollments?.length ?? 0,
      error: enrError,
    });

    if (enrError) {
      console.error("[fetchEnrolledCourses] Query error:", enrError);
      return out;
    }

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

      // Fetch modules and lessons for this course
      let modules: any[] = [];

      const targetCourseId = await resolveCourseId(courseId);
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("id, title, order_index")
        .eq("course_id", targetCourseId)
        .order("order_index", { ascending: true });

      if (modulesData && !modulesError && modulesData.length > 0) {
        const moduleIds = modulesData.map((m) => m.id);
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("id, module_id, title, duration_secs, order_index")
          .in("module_id", moduleIds)
          .order("order_index", { ascending: true });

        modules = modulesData.map((module: any) => ({
          id: module.id,
          title: module.title,
          position: module.order_index ?? 0,
          lessons: (lessonsData ?? [])
            .filter((l) => String((l as any).module_id) === String(module.id))
            .map((l: any) => ({
              id: l.id,
              title: l.title,
              duration_minutes: l.duration_secs ? Math.round(l.duration_secs / 60) : null,
              position: l.order_index ?? 0,
            })),
        }));
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
  total_secs?: number;
  raw_hours?: number;
  time_unit?: "h" | "m";
  display_time?: number;
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
  let currentStreak = 0;
  let longestStreak = 0;

  try {
    const { data: enr } = await supabase
      .from("enrollments")
      .select("id, completed_at")
      .eq("user_id", userId);
    const erows = (enr as Array<{ completed_at: string | null }>) ?? [];

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
    const { data: prog } = await supabase
      .from("lesson_progress")
      .select("time_spent_secs, last_watched_at, is_completed")
      .eq("user_id", userId);
    const prows =
      (prog as Array<{
        time_spent_secs: number | null;
        last_watched_at: string | null;
        is_completed: boolean | null;
      }>) ?? [];

    // Add demo progress records
    const demoProgressRows: Array<{
      time_spent_secs: number | null;
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
                time_spent_secs: item.time_spent_secs ?? 0,
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

    const allRows = [...prows, ...demoProgressRows];

    let secs = 0;
    const byDay: Record<string, number> = {};
    for (const r of allRows) {
      secs += r.time_spent_secs ?? 0;
      if (r.last_watched_at) {
        const key = r.last_watched_at.slice(0, 10);
        byDay[key] = (byDay[key] ?? 0) + 1;
      }
    }
    totalHours = secs < 3600 ? Math.round(secs / 60) : Math.round((secs / 3600) * 10) / 10;
    const time_unit: "h" | "m" = secs < 3600 ? "m" : "h";
    const raw_hours = Math.round((secs / 3600) * 10) / 10;
    for (const a of activity) a.count = byDay[a.date] ?? 0;
    for (const w of weekly) w.count = byDay[w.date] ?? 0;

    return {
      total_enrolled: totalEnrolled,
      total_completed: totalCompleted,
      total_hours: totalHours,
      total_secs: secs,
      raw_hours,
      time_unit,
      display_time: totalHours,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      activity,
      weekly,
    };
  } catch (err) {
    console.warn(`[makersflow] fetchProgressOverview lesson_progress threw:`, err);
  }

  try {
    const { data: streak } = await supabase
      .from("streaks")
      .select("current_streak, longest_streak, activity_log")
      .eq("user_id", userId)
      .maybeSingle();
    if (streak) {
      const s = streak as {
        current_streak?: number;
        longest_streak?: number;
        activity_log?: Record<string, number> | null;
      };
      currentStreak = s.current_streak ?? 0;
      longestStreak = s.longest_streak ?? 0;
      if (s.activity_log && typeof s.activity_log === "object") {
        for (const a of activity) {
          const v = (s.activity_log as Record<string, number>)[a.date];
          if (typeof v === "number" && v > a.count) a.count = v;
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
    total_secs: 0,
    raw_hours: 0,
    time_unit: "m",
    display_time: 0,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    activity,
    weekly,
  };
}
