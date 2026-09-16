/**
 * MakersFlow Lesson Progress Service
 * Canonical data layer for student lesson and course progress communicating with NestJS backend via apiClient.
 */

import { apiClient, type ApiResponse } from "@/lib/auth/apiClient";
import { courseService } from "@/lib/courseService";

export interface BackendLessonProgressItem {
  id?: string;
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
        const res: ApiResponse<any> =
          await apiClient.get<any>(
            `/lesson-progress/my/course/${targetCourseId}`,
          );

        if (!res.data) return null;

        const raw = res.data;
        const lessonsProgress: BackendLessonProgressItem[] = raw.lessons
          ? raw.lessons
              .filter((l: any) => l.progress != null)
              .map((l: any) => ({
                id: l.progress?.id ? String(l.progress.id) : undefined,
                lesson_id: String(l.lesson_id),
                is_completed: Boolean(l.progress?.is_completed),
                current_time_secs: Number(l.progress?.current_time_secs ?? 0),
                watch_percentage: Number(l.progress?.watch_percentage ?? 0),
                time_spent_secs: Number(l.progress?.time_spent_secs ?? 0),
                last_watched_at: l.progress?.last_watched_at ?? null,
              }))
          : (raw.lessonsProgress ?? []).map((p: any) => ({
              id: p.id ? String(p.id) : undefined,
              lesson_id: String(p.lesson_id),
              is_completed: Boolean(p.is_completed),
              current_time_secs: Number(p.current_time_secs ?? 0),
              watch_percentage: Number(p.watch_percentage ?? 0),
              time_spent_secs: Number(p.time_spent_secs ?? 0),
              last_watched_at: p.last_watched_at ?? null,
            }));

        const totalLessons = Number(
          raw.total_lessons ?? raw.totalLessons ?? (raw.lessons?.length || 0),
        );
        const completedLessonsCount = Number(
          raw.completed_lessons ??
            raw.completedLessonsCount ??
            lessonsProgress.filter((p) => p.is_completed).length,
        );
        const completedLessonIds = (
          raw.completedLessonIds ??
          lessonsProgress.filter((p) => p.is_completed).map((p) => p.lesson_id)
        ).map((id: any) => String(id));
        const completionPercentage = Number(
          raw.completion_percentage ??
            raw.completionPercentage ??
            (totalLessons > 0
              ? Math.round((completedLessonsCount / totalLessons) * 100)
              : 0),
        );
        const totalTimeSpentSecs = Number(
          raw.totalTimeSpentSecs ??
            lessonsProgress.reduce(
              (sum, p) => sum + (p.time_spent_secs || 0),
              0,
            ),
        );

        const normalized: BackendCourseProgress = {
          courseId: String(raw.course_id ?? raw.courseId ?? targetCourseId),
          totalLessons,
          completedLessonsCount,
          completedLessonIds,
          completionPercentage,
          totalTimeSpentSecs,
          lessonsProgress,
          lastAccessedLessonId: raw.lastAccessedLessonId
            ? String(raw.lastAccessedLessonId)
            : lessonsProgress.length > 0
              ? lessonsProgress[lessonsProgress.length - 1].lesson_id
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
   * Sync/Upsert lesson progress for current student via backend API.
   * Calls PATCH /lesson-progress/:id with UpdateLessonProgressDto if existing,
   * or POST /lesson-progress with CreateLessonProgressDto if new.
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
        throw new Error("Numeric ID conversion unsafe for lesson progress DTO");
      }

      // Check if progress record exists for this lesson
      const currentProgress = await this.getCourseProgress(targetCourseId);
      const existing = (currentProgress?.lessonsProgress as any[])?.find(
        (p: any) => String(p.lesson_id) === String(numLessonId),
      );

      let resultData: any = null;

      if (existing?.id) {
        // Record exists: PATCH /lesson-progress/:id (UpdateLessonProgressDto)
        const patchDto: Record<string, any> = {};
        if (payload.is_completed !== undefined) {
          patchDto.is_completed = Boolean(payload.is_completed);
        }
        if (payload.current_time_secs !== undefined) {
          patchDto.current_time_secs = Math.max(0, Math.floor(payload.current_time_secs));
        }
        if (payload.watch_percentage !== undefined) {
          patchDto.watch_percentage = Math.max(0, Math.min(100, Math.round(payload.watch_percentage)));
        }
        if (payload.time_spent_secs !== undefined) {
          patchDto.time_spent_secs = Math.max(0, Math.floor(payload.time_spent_secs));
        }
        if (payload.last_watched_at) {
          patchDto.last_watched_at = payload.last_watched_at;
        }

        const res = await apiClient.patch<any>(`/lesson-progress/${existing.id}`, patchDto);
        resultData = res.data ?? null;
      } else {
        // New record: POST /lesson-progress (CreateLessonProgressDto)
        const createDto: Record<string, any> = {
          course_id: numCourseId,
          lesson_id: numLessonId,
        };
        if (payload.is_completed !== undefined) {
          createDto.is_completed = Boolean(payload.is_completed);
        }
        if (payload.current_time_secs !== undefined) {
          createDto.current_time_secs = Math.max(0, Math.floor(payload.current_time_secs));
        }
        if (payload.watch_percentage !== undefined) {
          createDto.watch_percentage = Math.max(0, Math.min(100, Math.round(payload.watch_percentage)));
        }
        if (payload.time_spent_secs !== undefined) {
          createDto.time_spent_secs = Math.max(0, Math.floor(payload.time_spent_secs));
        }
        if (payload.last_watched_at) {
          createDto.last_watched_at = payload.last_watched_at;
        }

        try {
          const res = await apiClient.post<any>("/lesson-progress", createDto);
          resultData = res.data ?? null;
        } catch (postErr: any) {
          if (postErr?.status === 409 || postErr?.data?.statusCode === 409) {
            const refreshed = await this.getCourseProgress(targetCourseId, true);
            const found = (refreshed?.lessonsProgress as any[])?.find(
              (p: any) => String(p.lesson_id) === String(numLessonId),
            );
            if (found?.id) {
              const patchDto: Record<string, any> = {};
              if (payload.is_completed !== undefined) {
                patchDto.is_completed = Boolean(payload.is_completed);
              }
              if (payload.current_time_secs !== undefined) {
                patchDto.current_time_secs = Math.max(0, Math.floor(payload.current_time_secs));
              }
              if (payload.watch_percentage !== undefined) {
                patchDto.watch_percentage = Math.max(0, Math.min(100, Math.round(payload.watch_percentage)));
              }
              if (payload.time_spent_secs !== undefined) {
                patchDto.time_spent_secs = Math.max(0, Math.floor(payload.time_spent_secs));
              }
              if (payload.last_watched_at) {
                patchDto.last_watched_at = payload.last_watched_at;
              }

              const patchRes = await apiClient.patch<any>(`/lesson-progress/${found.id}`, patchDto);
              resultData = patchRes.data ?? null;
            }
          } else {
            throw postErr;
          }
        }
      }

      // Invalidate course progress cache for this course
      this.invalidateCourseCache(targetCourseId);

      if (!resultData) return null;

      return {
        id: resultData.id ? String(resultData.id) : undefined,
        lesson_id: String(resultData.lesson_id ?? numLessonId),
        is_completed: Boolean(resultData.is_completed),
        current_time_secs: Number(resultData.current_time_secs ?? 0),
        watch_percentage: Number(resultData.watch_percentage ?? 0),
        time_spent_secs: Number(resultData.time_spent_secs ?? 0),
        last_watched_at: resultData.last_watched_at ?? null,
      };
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
