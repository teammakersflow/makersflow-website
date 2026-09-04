/**
 * MakersFlow Review Service
 * Canonical data layer for course and product reviews communicating with NestJS backend via apiClient.
 */

import { apiClient, type ApiResponse } from "@/lib/auth/apiClient";
import { courseService } from "@/lib/courseService";

export interface CourseReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  status?: string;
}

export interface ProductReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  status?: string;
}

export interface MyReview {
  id: string;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface RatingSummaryItem {
  course_id?: number;
  product_id?: number;
  rating: number;
}

class ReviewService {
  // ─────────────────────────────────────────────
  // COURSE REVIEWS
  // ─────────────────────────────────────────────

  /**
   * Fetch approved and visible reviews for a course (GET /reviews/course/:courseId).
   */
  public async fetchCourseReviews(
    courseId: string | number,
  ): Promise<CourseReview[]> {
    const courseIdStr = String(courseId).trim();
    if (!courseIdStr) return [];

    try {
      const targetCourseId = await courseService.resolveCourseId(courseIdStr);
      const res: ApiResponse<any[]> = await apiClient.get<any[]>(
        `/reviews/course/${encodeURIComponent(String(targetCourseId))}`,
      );

      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
        ? (res as any)
        : [];

      return rawList.map((r: any) => ({
        id: String(r.id),
        rating: Number(r.rating) || 5,
        comment: r.comment ?? null,
        created_at: r.created_at || new Date().toISOString(),
        user_id: String(r.user_id),
        user_name: r.user?.full_name ?? null,
        user_avatar: r.user?.avatar_url ?? null,
        status: r.status,
      }));
    } catch (err) {
      console.error(`[ReviewService] fetchCourseReviews error for ${courseId}:`, err);
      return [];
    }
  }

  /**
   * Fetch current student's review for a course (GET /reviews/course/:courseId/my).
   * Authenticated student identity is derived from JWT.
   */
  public async fetchMyCourseReview(
    courseId: string | number,
  ): Promise<MyReview | null> {
    const courseIdStr = String(courseId).trim();
    if (!courseIdStr) return null;

    try {
      const targetCourseId = await courseService.resolveCourseId(courseIdStr);
      const res = await apiClient.get<any>(
        `/reviews/course/${encodeURIComponent(String(targetCourseId))}/my`,
      );

      const raw =
        res?.data !== undefined && res?.success !== undefined ? res.data : res;

      if (!raw || typeof raw !== "object" || !raw.id) {
        return null;
      }

      return {
        id: String(raw.id),
        rating: Number(raw.rating) || 5,
        comment: raw.comment ?? null,
        status: raw.status ?? "pending",
        created_at: raw.created_at || new Date().toISOString(),
      };
    } catch (err) {
      console.warn(`[ReviewService] fetchMyCourseReview error for ${courseId}:`, err);
      return null;
    }
  }

  /**
   * Submit or update review for a course (POST /reviews/course/:courseId).
   * Authenticated student identity is derived from JWT.
   */
  public async submitCourseReview(
    courseId: string | number,
    rating: number,
    comment?: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const courseIdStr = String(courseId).trim();
    if (!courseIdStr) {
      return { ok: false, error: "Invalid course ID" };
    }
    if (!rating || rating < 1 || rating > 5) {
      return { ok: false, error: "Please select a star rating (1-5)" };
    }

    try {
      const targetCourseId = await courseService.resolveCourseId(courseIdStr);
      await apiClient.post(`/reviews/course/${encodeURIComponent(String(targetCourseId))}`, {
        rating: Math.round(rating),
        comment: comment?.trim() || undefined,
      });

      return { ok: true };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Could not submit review";
      console.error(`[ReviewService] submitCourseReview error for ${courseId}:`, err);
      return { ok: false, error: msg };
    }
  }

  /**
   * Fetch lightweight course ratings summary (GET /reviews/ratings/courses).
   */
  public async fetchCourseRatingsSummary(): Promise<RatingSummaryItem[]> {
    try {
      const res: ApiResponse<any[]> = await apiClient.get<any[]>(
        "/reviews/ratings/courses",
      );
      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
        ? (res as any)
        : [];

      return rawList.map((r: any) => ({
        course_id: Number(r.course_id),
        rating: Number(r.rating) || 5,
      }));
    } catch (err) {
      console.warn("[ReviewService] fetchCourseRatingsSummary error:", err);
      return [];
    }
  }

  // ─────────────────────────────────────────────
  // PRODUCT REVIEWS
  // ─────────────────────────────────────────────

  /**
   * Fetch approved and visible reviews for a product (GET /reviews/product/:productId).
   */
  public async fetchProductReviews(
    productId: string | number,
  ): Promise<ProductReview[]> {
    const productIdStr = String(productId).trim();
    if (!productIdStr) return [];

    try {
      const res: ApiResponse<any[]> = await apiClient.get<any[]>(
        `/reviews/product/${encodeURIComponent(productIdStr)}`,
      );

      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
        ? (res as any)
        : [];

      return rawList.map((r: any) => ({
        id: String(r.id),
        rating: Number(r.rating) || 5,
        comment: r.comment ?? null,
        created_at: r.created_at || new Date().toISOString(),
        user_id: String(r.user_id),
        user_name: r.user?.email ? r.user.email.split("@")[0] : null,
        user_avatar: null,
        status: r.status,
      }));
    } catch (err) {
      console.error(`[ReviewService] fetchProductReviews error for ${productId}:`, err);
      return [];
    }
  }

  /**
   * Fetch current student's review for a product (GET /reviews/product/:productId/my).
   * Authenticated student identity is derived from JWT.
   */
  public async fetchMyProductReview(
    productId: string | number,
  ): Promise<MyReview | null> {
    const productIdStr = String(productId).trim();
    if (!productIdStr) return null;

    try {
      const res = await apiClient.get<any>(
        `/reviews/product/${encodeURIComponent(productIdStr)}/my`,
      );

      const raw =
        res?.data !== undefined && res?.success !== undefined ? res.data : res;

      if (!raw || typeof raw !== "object" || !raw.id) {
        return null;
      }

      return {
        id: String(raw.id),
        rating: Number(raw.rating) || 5,
        comment: raw.comment ?? null,
        status: raw.status ?? "pending",
        created_at: raw.created_at || new Date().toISOString(),
      };
    } catch (err) {
      console.warn(`[ReviewService] fetchMyProductReview error for ${productId}:`, err);
      return null;
    }
  }

  /**
   * Submit or update review for a product (POST /reviews/product/:productId).
   * Authenticated student identity is derived from JWT.
   */
  public async submitProductReview(
    productId: string | number,
    rating: number,
    comment?: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const productIdStr = String(productId).trim();
    if (!productIdStr) {
      return { ok: false, error: "Invalid product ID" };
    }
    if (!rating || rating < 1 || rating > 5) {
      return { ok: false, error: "Please select a star rating (1-5)" };
    }

    try {
      await apiClient.post(`/reviews/product/${encodeURIComponent(productIdStr)}`, {
        rating: Math.round(rating),
        comment: comment?.trim() || undefined,
      });

      return { ok: true };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Could not submit review";
      console.error(`[ReviewService] submitProductReview error for ${productId}:`, err);
      return { ok: false, error: msg };
    }
  }

  /**
   * Fetch lightweight product ratings summary (GET /reviews/ratings/products).
   */
  public async fetchProductRatingsSummary(): Promise<RatingSummaryItem[]> {
    try {
      const res: ApiResponse<any[]> = await apiClient.get<any[]>(
        "/reviews/ratings/products",
      );
      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
        ? (res as any)
        : [];

      return rawList.map((r: any) => ({
        product_id: Number(r.product_id),
        rating: Number(r.rating) || 5,
      }));
    } catch (err) {
      console.warn("[ReviewService] fetchProductRatingsSummary error:", err);
      return [];
    }
  }
}

export const reviewService = new ReviewService();
