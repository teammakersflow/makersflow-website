/**
 * MakersFlow Enrollment Service
 * Canonical data layer for student enrollments communicating with NestJS backend via apiClient.
 */

import { apiClient, type ApiResponse } from "@/lib/auth/apiClient";
import { courseService } from "@/lib/courseService";

export interface BackendEnrollmentCourse {
  id: string;
  title: string;
  category?: string | null;
  level?: string | null;
  thumbnail_url?: string | null;
  is_free?: boolean | null;
  price?: number | null;
  slug?: string | null;
}

export interface BackendEnrollment {
  id: string;
  user_id: string;
  course_id: string; // BigInt serialized as string
  enrolled_at: string | null;
  completed_at: string | null;
  payment_status: string;
  razorpay_order_id?: string | null;
  expires_at: string | null;
  courses?: BackendEnrollmentCourse;
}

export interface EnrollmentResult {
  ok: boolean;
  data?: BackendEnrollment;
  message?: string;
  error?: string;
}

class EnrollmentService {
  private cacheTTL = 30 * 1000; // 30 seconds
  private myEnrollmentsCache: { data: BackendEnrollment[]; timestamp: number } | null = null;
  private pendingMyEnrollmentsPromise: Promise<BackendEnrollment[]> | null = null;

  /**
   * Invalidate the in-memory enrollments cache.
   */
  public invalidateCache(): void {
    this.myEnrollmentsCache = null;
    this.pendingMyEnrollmentsPromise = null;
  }

  /**
   * Retrieve active enrollments for the authenticated student (GET /enrollments/me).
   * Authenticated user identity is determined by JWT Bearer token on the backend.
   */
  public async getMyEnrollments(forceRefresh = false): Promise<BackendEnrollment[]> {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.myEnrollmentsCache &&
      now - this.myEnrollmentsCache.timestamp < this.cacheTTL
    ) {
      return this.myEnrollmentsCache.data;
    }

    if (this.pendingMyEnrollmentsPromise && !forceRefresh) {
      return this.pendingMyEnrollmentsPromise;
    }

    this.pendingMyEnrollmentsPromise = (async () => {
      try {
        const res: ApiResponse<BackendEnrollment[]> =
          await apiClient.get<BackendEnrollment[]>("/enrollments/me");

        const enrollments = res.data ?? [];
        // Normalize IDs to strings
        const normalized = enrollments.map((e) => ({
          ...e,
          id: String(e.id),
          course_id: String(e.course_id),
          courses: e.courses
            ? {
                ...e.courses,
                id: String(e.courses.id),
              }
            : undefined,
        }));

        this.myEnrollmentsCache = { data: normalized, timestamp: Date.now() };
        return normalized;
      } catch (err) {
        console.error("[EnrollmentService] getMyEnrollments failed:", err);
        return [];
      } finally {
        this.pendingMyEnrollmentsPromise = null;
      }
    })();

    return this.pendingMyEnrollmentsPromise;
  }

  /**
   * Check if current student is actively enrolled in a course.
   */
  public async isEnrolled(
    courseId: string | number,
    userId?: string,
  ): Promise<boolean> {
    const courseIdStr = String(courseId);

    // Support explicit demo course tracking
    if (courseIdStr.startsWith("demo-")) {
      try {
        if (!userId && typeof window !== "undefined") {
          // Attempt to find any demo enrollment key if userId not provided
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith("demo_enrollments_")) {
              const ids = JSON.parse(localStorage.getItem(k) || "[]");
              if (ids.includes(courseIdStr)) return true;
            }
          }
          return false;
        }
        const key = `demo_enrollments_${userId}`;
        const current: string[] = JSON.parse(localStorage.getItem(key) || "[]");
        return current.includes(courseIdStr);
      } catch {
        return false;
      }
    }

    try {
      const targetCourseId = await courseService.resolveCourseId(courseIdStr);
      const enrollments = await this.getMyEnrollments();

      const record = enrollments.find(
        (e) =>
          String(e.course_id) === String(targetCourseId) ||
          String(e.courses?.id) === String(targetCourseId),
      );

      if (!record) return false;

      // Free courses grant access regardless of payment status (aligns with backend OR rule)
      if (record.courses?.is_free) {
        if (record.expires_at) {
          const expiryDate = new Date(record.expires_at);
          if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
            return false;
          }
        }
        return true;
      }

      // Paid course: verify payment status is valid
      if (
        record.payment_status &&
        ["pending", "failed", "cancelled", "refunded"].includes(record.payment_status)
      ) {
        return false;
      }

      // 1-year access window check if expires_at is present
      if (record.expires_at) {
        const expiryDate = new Date(record.expires_at);
        if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
          return false;
        }
      }

      return true;
    } catch (err) {
      console.warn("[EnrollmentService] isEnrolled error:", err);
      return false;
    }
  }

  /**
   * Enroll authenticated student in a free course (POST /courses/:id/enroll).
   */
  public async enrollInCourse(
    courseId: string | number,
    isFree = true,
    userId?: string,
  ): Promise<EnrollmentResult> {
    const courseIdStr = String(courseId);

    // Paid-course behavior must not be incorrectly treated as free enrollment
    if (!isFree) {
      return {
        ok: false,
        error: "Course is not free. Please purchase through store checkout.",
      };
    }

    // Handle demo courses locally
    if (courseIdStr.startsWith("demo-")) {
      try {
        const effectiveUserId = userId || "demo_user";
        const key = `demo_enrollments_${effectiveUserId}`;
        const current: string[] = JSON.parse(localStorage.getItem(key) || "[]");
        if (!current.includes(courseIdStr)) {
          current.push(courseIdStr);
          localStorage.setItem(key, JSON.stringify(current));
        }
        return { ok: true, message: "Enrolled in demo course" };
      } catch (err: any) {
        return { ok: false, error: err?.message || "Failed to store demo enrollment" };
      }
    }

    try {
      const targetCourseId = await courseService.resolveCourseId(courseIdStr);

      const res = await apiClient.post<BackendEnrollment>(
        `/courses/${targetCourseId}/enroll`,
        {},
      );

      // Invalidate cache on successful enrollment
      this.invalidateCache();

      return {
        ok: true,
        data: res.data,
        message: res.message || "Enrolled successfully",
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to enroll";

      // If backend reports already enrolled, treat as successful idempotent operation
      if (typeof msg === "string" && msg.toLowerCase().includes("already enrolled")) {
        this.invalidateCache();
        return { ok: true, message: "Already enrolled in this course" };
      }

      console.error("[EnrollmentService] enrollInCourse error:", err);
      return { ok: false, error: msg };
    }
  }
}

export const enrollmentService = new EnrollmentService();
