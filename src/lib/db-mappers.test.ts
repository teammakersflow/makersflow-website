import { describe, it, expect } from "vitest";
import {
  mapDbLessonToDetail,
  mapDbLessonResource,
  mapDbLessonProgress,
} from "./db-mappers";
import { fetchLesson, fetchCourseProgressMap } from "./learn-data";

describe("db-mappers", () => {
  describe("mapDbLessonToDetail", () => {
    it("correctly converts order_index to position and duration_secs to duration_minutes", () => {
      const raw = {
        id: 42,
        module_id: 10,
        title: "Introduction",
        content: "Content text",
        video_url: "https://video.mp4",
        order_index: 3,
        duration_secs: 184, // ~3 minutes
        notes: "Lesson notes",
      };
      const result = mapDbLessonToDetail(raw, "course-123");
      expect(result).toEqual({
        id: "42",
        course_id: "course-123",
        module_id: "10",
        title: "Introduction",
        description: null,
        video_url: "https://video.mp4",
        content: "Content text",
        notes: "Lesson notes",
        duration_minutes: 3,
        position: 3,
      });
    });

    it("handles null/missing fields gracefully with defaults", () => {
      const raw = { id: 1, title: null };
      const result = mapDbLessonToDetail(raw, "course-1");
      expect(result.title).toBe("Untitled Lesson");
      expect(result.position).toBe(0);
      expect(result.duration_minutes).toBeNull();
      expect(result.notes).toBeNull();
    });

    it("falls back notes to content if notes field is null", () => {
      const raw = { id: 1, title: "Test", content: "Fallback notes content", notes: null };
      const result = mapDbLessonToDetail(raw, "course-1");
      expect(result.notes).toBe("Fallback notes content");
    });
  });

  describe("mapDbLessonResource", () => {
    it("maps raw resource object correctly", () => {
      const raw = { id: "res-1", title: "PDF Guide", url: "https://file.pdf", type: "pdf", size_bytes: 1024 };
      expect(mapDbLessonResource(raw)).toEqual({
        id: "res-1",
        title: "PDF Guide",
        url: "https://file.pdf",
        type: "pdf",
        size_bytes: 1024,
      });
    });
  });

  describe("mapDbLessonProgress", () => {
    it("transforms raw DB lesson progress row into LessonProgressRow", () => {
      const raw = {
        lesson_id: 101,
        course_id: "course-1",
        current_time_secs: 45,
        watch_percentage: 50,
        time_spent_secs: 120,
        is_completed: true,
        last_watched_at: "2026-07-20T12:00:00Z",
      };
      expect(mapDbLessonProgress(raw)).toEqual({
        lesson_id: "101",
        course_id: "course-1",
        current_time_secs: 45,
        watch_percentage: 50,
        time_spent_secs: 120,
        is_completed: true,
        last_watched_at: "2026-07-20T12:00:00Z",
      });
    });
  });

  describe("demo-mode regression protection", () => {
    it("fetches demo course lessons correctly without throwing non-numeric ID errors", async () => {
      const lesson = await fetchLesson("demo-1", "l1");
      expect(lesson).toBeDefined();
      expect(lesson.id).toBe("l1");
      expect(lesson.course_id).toBe("demo-1");
    });

    it("fetches demo course progress correctly from localStorage fallback", async () => {
      const progress = await fetchCourseProgressMap("user-demo", "demo-1");
      expect(progress).toEqual({});
    });
  });
});

