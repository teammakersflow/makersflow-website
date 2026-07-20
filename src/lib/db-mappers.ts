import type { LessonDetail, LessonResource, LessonProgressRow } from "./learn-data";

export type RawDbLesson = {
  id: number | string;
  module_id?: number | string | null;
  title?: string | null;
  content?: string | null;
  video_url?: string | null;
  order_index?: number | null;
  duration_secs?: number | null;
  notes?: string | null;
};

export type RawDbLessonResource = {
  id: string;
  title?: string | null;
  url: string;
  type?: string | null;
  size_bytes?: number | null;
};

export type RawDbLessonProgress = {
  lesson_id: number | string;
  course_id: string;
  current_time_secs?: number | null;
  watch_percentage?: number | null;
  time_spent_secs?: number | null;
  is_completed?: boolean | null;
  last_watched_at?: string | null;
};

export function mapDbLessonToDetail(raw: RawDbLesson, courseId: string): LessonDetail {
  return {
    id: String(raw.id),
    course_id: courseId,
    module_id: raw.module_id ? String(raw.module_id) : null,
    title: raw.title ?? "Untitled Lesson",
    description: null,
    video_url: raw.video_url ?? null,
    content: raw.content ?? null,
    notes: raw.notes ?? raw.content ?? null,
    duration_minutes: raw.duration_secs ? Math.round(raw.duration_secs / 60) : null,
    position: raw.order_index ?? 0,
  };
}

export function mapDbLessonResource(raw: RawDbLessonResource): LessonResource {
  return {
    id: String(raw.id),
    title: raw.title ?? "Untitled Resource",
    url: raw.url,
    type: raw.type ?? null,
    size_bytes: raw.size_bytes ?? null,
  };
}

export function mapDbLessonProgress(raw: RawDbLessonProgress): LessonProgressRow {
  return {
    lesson_id: String(raw.lesson_id),
    course_id: raw.course_id,
    current_time_secs: raw.current_time_secs ?? 0,
    watch_percentage: raw.watch_percentage ?? 0,
    time_spent_secs: raw.time_spent_secs ?? 0,
    is_completed: Boolean(raw.is_completed),
    last_watched_at: raw.last_watched_at ?? null,
  };
}
