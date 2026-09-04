/**
 * MakersFlow Lesson Progress Service
 * Canonical data layer for student lesson and course progress communicating with NestJS backend via apiClient.
 */

import { apiClient, type ApiResponse } from "@/lib/auth/apiClient";
import { courseService } from "@/lib/courseService";

export interface BackendLessonProgressItem {
  lesson_id: string;
  is_completed: boolean;
  current_time_secs: number;
  watch_percentage: number;
  time_spent_secs: number;
  last_watched_at: string | null;
}

export interface BackendCourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessonsCount: number;
  completedLessonIds: string[];
  completionPercentage: number;
  totalTimeSpentSecs: number;
  lessonsProgress: BackendLessonProgressItem[];
  lastAccessedLessonId: string | null;
}

export interface SyncProgressPayload {
  course_id: string | number;
  lesson_id: string | number;
  is_completed?: boolean;
  current_time_secs?: number;
  watch_percentage?: number;
  time_spent_secs?: number;
  last_watched_at?: string;
}

class ProgressService {
  private cacheTTL = 15 * 1000; // 15 seconds
  private courseProgressCache = new Map<
    string,
    { data: BackendCourseProgress; timestamp: number }
  >();
  private pendingCourseProgressPromises = new Map<
    string,
    Promise<BackendCourseProgress | null>
  >();

  /**
   * Invalidate cached progress for a specific course or all courses.
   */
  public invalidateCourseCache(courseId?: string | number): void {
    if (courseId) {
      const idStr = String(courseId);
      this.courseProgressCache.delete(idStr);
      this.pendingCourseProgressPromises.delete(idStr);
    } else {
      this.courseProgressCache.clear();
      this.pendingCourseProgressPromises.clear();
    }
  }

  /**
   * Fetch course progress for the current student (GET /lesson-progress/course/:courseId).
   * Authenticated user identity is determined by JWT Bearer token on the backend.
   */
  public async getCourseProgress(
    courseId: string | number,
    forceRefresh = false,
  ): Promise<BackendCourseProgress | null> {
    const courseIdStr = String(courseId);

    // Handle demo courses locally
    if (courseIdStr.startsWith("demo-")) {
      return null;
    }

    const targetCourseId = await courseService.resolveCourseId(courseIdStr);
    const now = Date.now();
    const cached = this.courseProgressCache.get(targetCourseId);

    if (!forceRefresh && cached && now - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    if (this.pendingCourseProgressPromises.has(targetCourseId) && !forceRefresh) {
      return this.pendingCourseProgressPromises.get(targetCourseId)!;
    }

    const promise = (async () => {
      try {
        const res: ApiResponse<BackendCourseProgress> =
          await apiClient.get<BackendCourseProgress>(
            `/lesson-progress/course/${targetCourseId}`,
          );

        if (!res.data) return null;

        const raw = res.data;
        const normalized: BackendCourseProgress = {
          courseId: String(raw.courseId),
          totalLessons: Number(raw.totalLessons ?? 0),
          completedLessonsCount: Number(raw.completedLessonsCount ?? 0),
          completedLessonIds: (raw.completedLessonIds ?? []).map((id) => String(id)),
          completionPercentage: Number(raw.completionPercentage ?? 0),
          totalTimeSpentSecs: Number(raw.totalTimeSpentSecs ?? 0),
          lessonsProgress: (raw.lessonsProgress ?? []).map((p) => ({
            lesson_id: String(p.lesson_id),
            is_completed: Boolean(p.is_completed),
            current_time_secs: Number(p.current_time_secs ?? 0),
            watch_percentage: Number(p.watch_percentage ?? 0),
            time_spent_secs: Number(p.time_spent_secs ?? 0),
            last_watched_at: p.last_watched_at ?? null,
          })),
          lastAccessedLessonId: raw.lastAccessedLessonId
            ? String(raw.lastAccessedLessonId)
            : null,
        };

        this.courseProgressCache.set(targetCourseId, {
          data: normalized,
          timestamp: Date.now(),
        });

        return normalized;
      } catch (err) {
        console.warn(`[ProgressService] getCourseProgress failed for ${targetCourseId}:`, err);
        return null;
      } finally {
        this.pendingCourseProgressPromises.delete(targetCourseId);
      }
    })();

    this.pendingCourseProgressPromises.set(targetCourseId, promise);
    return promise;
  }

  /**
   * Sync/Upsert lesson progress for current student (POST /lesson-progress/sync).
   * Notice: Backend DTO expects numeric course_id and lesson_id.
   * Safe integer boundary conversion is performed only at this HTTP boundary.
   */
  public async syncLessonProgress(
    payload: SyncProgressPayload,
  ): Promise<BackendLessonProgressItem | null> {
    const courseIdStr = String(payload.course_id);
    const lessonIdStr = String(payload.lesson_id);

    // Skip remote sync for demo courses
    if (courseIdStr.startsWith("demo-")) {
      return null;
    }

    try {
      const targetCourseId = await courseService.resolveCourseId(courseIdStr);

      const numCourseId = Number(targetCourseId);
      const numLessonId = Number(lessonIdStr);

      if (
        !Number.isSafeInteger(numCourseId) ||
        numCourseId <= 0 ||
        !Number.isSafeInteger(numLessonId) ||
        numLessonId <= 0
      ) {
        console.error(
          "[ProgressService] ID exceeds safe integer bounds or is non-positive for sync:",
          { targetCourseId, lessonIdStr },
        );
        throw new Error("Numeric ID conversion unsafe for lesson progress sync DTO");
      }

      const body: Record<string, any> = {
        course_id: numCourseId,
        lesson_id: numLessonId,
      };

      if (payload.is_completed !== undefined) {
        body.is_completed = Boolean(payload.is_completed);
      }
      if (payload.current_time_secs !== undefined) {
        body.current_time_secs = Math.max(0, Math.floor(payload.current_time_secs));
      }
      if (payload.watch_percentage !== undefined) {
        body.watch_percentage = Math.max(0, Math.min(100, Math.round(payload.watch_percentage)));
      }
      if (payload.time_spent_secs !== undefined) {
        body.time_spent_secs = Math.max(0, Math.floor(payload.time_spent_secs));
      }
      if (payload.last_watched_at) {
        body.last_watched_at = payload.last_watched_at;
      }

      const res = await apiClient.post<BackendLessonProgressItem>(
        "/lesson-progress/sync",
        body,
      );

      // Invalidate course progress cache for this course
      this.invalidateCourseCache(targetCourseId);

      return res.data ?? null;
    } catch (err) {
      console.error("[ProgressService] syncLessonProgress failed:", err);
      throw err;
    }
  }

  /**
   * Mark a lesson as complete for current student.
   */
  public async markLessonComplete(
    courseId: string | number,
    lessonId: string | number,
  ): Promise<any> {
    return this.syncLessonProgress({
      course_id: courseId,
      lesson_id: lessonId,
      is_completed: true,
      watch_percentage: 100,
      last_watched_at: new Date().toISOString(),
    });
  }
}

export const progressService = new ProgressService();
