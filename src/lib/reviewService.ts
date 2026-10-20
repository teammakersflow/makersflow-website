/**
 * MakersFlow Review Service
 * Canonical data layer for course and product reviews communicating with NestJS backend via apiClient.
 * Supabase is retained strictly as a bounded fallback for genuine network/server outages.
 */

import { apiClient, ApiError, type ApiResponse } from "@/lib/auth/apiClient";
import { customAuthService } from "@/lib/auth/customAuthService";
import { supabase } from "@/integrations/supabase/client";
import { courseService } from "@/lib/courseService";

function isNetworkOrUnavailable(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof ApiError) {
    return (
      err.status === 0 ||
      err.status === 408 ||
      err.status === 502 ||
      err.status === 503 ||
      err.status === 504
    );
  }
  if (err instanceof Error) {
    return err.name === "AbortError" || /network|failed to fetch/i.test(err.message);
  }
  return false;
}

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
   * Falls back to Supabase only on genuine backend/network unavailability.
   */
  public async fetchCourseReviews(
    courseId: string | number,
  ): Promise<CourseReview[]> {
    const courseIdStr = String(courseId).trim();
    if (!courseIdStr) return [];

    let targetCourseId: string | number = courseIdStr;
    try {
      targetCourseId = await courseService.resolveCourseId(courseIdStr);
    } catch {
      targetCourseId = courseIdStr;
    }

    try {
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
        user_name: r.users?.full_name ?? r.user?.full_name ?? null,
        user_avatar: r.users?.avatar_url ?? r.user?.avatar_url ?? null,
        status: r.status,
      }));
    } catch (err: unknown) {
      if (!isNetworkOrUnavailable(err)) {
        console.warn(`[ReviewService] Backend /reviews/course/${courseId} application error:`, err);
        return [];
      }

      console.warn(`[ReviewService] Backend unavailable, attempting Supabase fallback for course reviews ${courseId}:`, err);
      try {
        const numericCourseId = Number(targetCourseId);
        const { data, error: sbError } = await supabase
          .from("reviews")
          .select("id, user_id, course_id, rating, comment, status, created_at, users!user_id(id, full_name, avatar_url)")
          .eq("course_id", numericCourseId)
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (sbError || !data) {
          console.warn("[ReviewService] Supabase course reviews fallback error:", sbError);
          return [];
        }

        return data.map((r: any) => ({
          id: String(r.id),
          rating: Number(r.rating) || 5,
          comment: r.comment ?? null,
          created_at: r.created_at || new Date().toISOString(),
          user_id: String(r.user_id),
          user_name: r.users?.full_name ?? null,
          user_avatar: r.users?.avatar_url ?? null,
          status: r.status,
        }));
      } catch (fallbackErr) {
        console.warn("[ReviewService] Supabase course reviews fallback unexpected error:", fallbackErr);
        return [];
      }
    }
  }

  /**
   * Fetch current student's review for a course (GET /reviews/course/:courseId/my).
   * Authenticated student identity is derived from JWT.
   * Falls back to Supabase only on genuine backend/network unavailability.
   */
  public async fetchMyCourseReview(
    courseId: string | number,
  ): Promise<MyReview | null> {
    const courseIdStr = String(courseId).trim();
    if (!courseIdStr) return null;

    let targetCourseId: string | number = courseIdStr;
    try {
      targetCourseId = await courseService.resolveCourseId(courseIdStr);
    } catch {
      targetCourseId = courseIdStr;
    }

    try {
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
    } catch (err: unknown) {
      if (!isNetworkOrUnavailable(err)) {
        console.warn(`[ReviewService] Backend /reviews/course/${courseId}/my application error:`, err);
        return null;
      }

      console.warn(`[ReviewService] Backend unavailable, attempting Supabase fallback for my review ${courseId}:`, err);
      try {
        const currentUserId = customAuthService.getCachedUser()?.id;
        if (!currentUserId) return null;

        const numericCourseId = Number(targetCourseId);
        const { data, error: sbError } = await supabase
          .from("reviews")
          .select("id, user_id, course_id, rating, comment, status, created_at")
          .eq("course_id", numericCourseId)
          .eq("user_id", currentUserId)
          .maybeSingle();

        if (sbError || !data) return null;

        return {
          id: String(data.id),
          rating: Number(data.rating) || 5,
          comment: data.comment ?? null,
          status: data.status ?? "pending",
          created_at: data.created_at || new Date().toISOString(),
        };
      } catch (fallbackErr) {
        console.warn("[ReviewService] Supabase my review fallback unexpected error:", fallbackErr);
        return null;
      }
    }
  }

  /**
   * Submit or update review for a course (POST /reviews/course/:courseId).
   * Authenticated student identity is derived from JWT on the backend.
   * Falls back to Supabase only on genuine backend/network unavailability.
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

    let targetCourseId: string | number = courseIdStr;
    try {
      targetCourseId = await courseService.resolveCourseId(courseIdStr);
    } catch {
      targetCourseId = courseIdStr;
    }

    try {
      await apiClient.post(`/reviews/course/${encodeURIComponent(String(targetCourseId))}`, {
        rating: Math.round(rating),
        comment: comment?.trim() || undefined,
      });

      return { ok: true };
    } catch (err: any) {
      if (!isNetworkOrUnavailable(err)) {
        const msg =
          err?.data?.message || err?.response?.data?.message || err?.message || "Could not submit review";
        console.error(`[ReviewService] submitCourseReview application error for ${courseId}:`, err);
        return { ok: false, error: msg };
      }

      console.warn(`[ReviewService] Backend unavailable on submitCourseReview for ${courseId}, attempting Supabase fallback:`, err);
      try {
        const currentUserId = customAuthService.getCachedUser()?.id;
        if (!currentUserId) {
          return { ok: false, error: "Please sign in to submit a review." };
        }

        const numericCourseId = Number(targetCourseId);
        const { error: sbError } = await supabase
          .from("reviews")
          .upsert(
            {
              user_id: currentUserId,
              course_id: numericCourseId,
              rating: Math.round(rating),
              comment: comment?.trim() || null,
              status: "pending",
            },
            { onConflict: "user_id,course_id" }
          );

        if (sbError) {
          console.error("[ReviewService] Supabase submitCourseReview fallback error:", sbError);
          return { ok: false, error: sbError.message };
        }

        return { ok: true };
      } catch (fallbackErr: any) {
        console.error("[ReviewService] Supabase submitCourseReview unexpected fallback error:", fallbackErr);
        return { ok: false, error: fallbackErr?.message || "Network error while submitting review." };
      }
    }
  }

  /**
   * Fetch lightweight course ratings summary (GET /reviews/ratings/courses).
   * Normalizes backend Prisma groupBy format (_avg, _count) into compatible entries.
   * Falls back to Supabase only on genuine backend/network unavailability.
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

      const items: RatingSummaryItem[] = [];
      rawList.forEach((entry: any) => {
        const cId = Number(entry.course_id);
        const avg = entry._avg?.rating != null ? Number(entry._avg.rating) : Number(entry.rating) || 0;
        const count = entry._count?.id != null ? Number(entry._count.id) : 1;

        if (count > 0 && avg > 0) {
          for (let i = 0; i < count; i++) {
            items.push({ course_id: cId, rating: avg });
          }
        } else if (avg > 0) {
          items.push({ course_id: cId, rating: avg });
        }
      });

      return items;
    } catch (err: unknown) {
      if (!isNetworkOrUnavailable(err)) {
        console.warn("[ReviewService] Backend /reviews/ratings/courses application error:", err);
        return [];
      }

      console.warn("[ReviewService] Backend unavailable, attempting Supabase fallback for course ratings summary:", err);
      try {
        const { data, error: sbError } = await supabase
          .from("reviews")
          .select("course_id, rating")
          .eq("status", "approved");

        if (sbError || !data) {
          console.warn("[ReviewService] Supabase course ratings summary fallback error:", sbError);
          return [];
        }

        return data.map((r: any) => ({
          course_id: Number(r.course_id),
          rating: Number(r.rating) || 0,
        }));
      } catch (fallbackErr) {
        console.warn("[ReviewService] Supabase course ratings fallback unexpected error:", fallbackErr);
        return [];
      }
    }
  }

  // ─────────────────────────────────────────────
  // PRODUCT REVIEWS
  // ─────────────────────────────────────────────

  /**
   * Fetch approved and visible reviews for a product (GET /reviews/product/:productId).
   * Falls back to Supabase only on genuine backend/network unavailability.
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
        user_name: r.users?.full_name ?? r.user?.full_name ?? (r.user?.email ? r.user.email.split("@")[0] : "Verified Buyer"),
        user_avatar: null,
        status: r.status,
      }));
    } catch (err: unknown) {
      if (!isNetworkOrUnavailable(err)) {
        console.warn(`[ReviewService] Backend /reviews/product/${productId} application error:`, err);
        return [];
      }

      console.warn(`[ReviewService] Backend unavailable, attempting Supabase fallback for product reviews ${productId}:`, err);
      try {
        const numericProductId = Number(productIdStr);
        const { data, error: sbError } = await supabase
          .from("product_reviews")
          .select("id, user_id, product_id, rating, comment, status, created_at")
          .eq("product_id", numericProductId)
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (sbError || !data) {
          console.warn("[ReviewService] Supabase product reviews fallback error:", sbError);
          return [];
        }

        return data.map((r: any) => ({
          id: String(r.id),
          rating: Number(r.rating) || 5,
          comment: r.comment ?? null,
          created_at: r.created_at || new Date().toISOString(),
          user_id: String(r.user_id),
          user_name: "Verified Buyer",
          user_avatar: null,
          status: r.status,
        }));
      } catch (fallbackErr) {
        console.warn("[ReviewService] Supabase product reviews fallback unexpected error:", fallbackErr);
        return [];
      }
    }
  }

  /**
   * Fetch current student's review for a product (GET /reviews/product/:productId/my).
   * Authenticated student identity is derived from JWT.
   * Falls back to Supabase only on genuine backend/network unavailability.
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
    } catch (err: unknown) {
      if (!isNetworkOrUnavailable(err)) {
        console.warn(`[ReviewService] Backend /reviews/product/${productId}/my application error:`, err);
        return null;
      }

      console.warn(`[ReviewService] Backend unavailable, attempting Supabase fallback for my product review ${productId}:`, err);
      try {
        const currentUserId = customAuthService.getCachedUser()?.id;
        if (!currentUserId) return null;

        const numericProductId = Number(productIdStr);
        const { data, error: sbError } = await supabase
          .from("product_reviews")
          .select("id, user_id, product_id, rating, comment, status, created_at")
          .eq("product_id", numericProductId)
          .eq("user_id", currentUserId)
          .maybeSingle();

        if (sbError || !data) return null;

        return {
          id: String(data.id),
          rating: Number(data.rating) || 5,
          comment: data.comment ?? null,
          status: data.status ?? "pending",
          created_at: data.created_at || new Date().toISOString(),
        };
      } catch (fallbackErr) {
        console.warn("[ReviewService] Supabase my product review fallback unexpected error:", fallbackErr);
        return null;
      }
    }
  }

  /**
   * Submit or update review for a product (POST /reviews/product/:productId).
   * Authenticated student identity is derived from JWT on the backend.
   * Falls back to Supabase only on genuine backend/network unavailability.
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
      if (!isNetworkOrUnavailable(err)) {
        const msg =
          err?.data?.message || err?.response?.data?.message || err?.message || "Could not submit review";
        console.error(`[ReviewService] submitProductReview application error for ${productId}:`, err);
        return { ok: false, error: msg };
      }

      console.warn(`[ReviewService] Backend unavailable on submitProductReview for ${productId}, attempting Supabase fallback:`, err);
      try {
        const currentUserId = customAuthService.getCachedUser()?.id;
        if (!currentUserId) {
          return { ok: false, error: "Please sign in to submit a review." };
        }

        const numericProductId = Number(productIdStr);
        const { error: sbError } = await supabase
          .from("product_reviews")
          .upsert(
            {
              user_id: currentUserId,
              product_id: numericProductId,
              rating: Math.round(rating),
              comment: comment?.trim() || null,
              status: "pending",
            },
            { onConflict: "user_id,product_id" }
          );

        if (sbError) {
          console.error("[ReviewService] Supabase submitProductReview fallback error:", sbError);
          return { ok: false, error: sbError.message };
        }

        return { ok: true };
      } catch (fallbackErr: any) {
        console.error("[ReviewService] Supabase submitProductReview unexpected fallback error:", fallbackErr);
        return { ok: false, error: fallbackErr?.message || "Network error while submitting review." };
      }
    }
  }

  
  /**
   * Update an existing product review (PATCH /reviews/:id).
   * The backend verifies ownership and returns edited reviews to pending.
   */
  public async updateProductReview(
    reviewId: string,
    rating: number,
    comment?: string,
  ): Promise<{ ok: boolean; error?: string }> {
    if (!reviewId.trim()) {
      return { ok: false, error: "Invalid review ID" };
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { ok: false, error: "Please select a star rating (1-5)" };
    }

    try {
      await apiClient.patch(`/reviews/${encodeURIComponent(reviewId)}`, {
        rating,
        comment: comment?.trim() ?? "",
      });

      return { ok: true };
    } catch (err: any) {
      const message =
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Could not update review";

      console.error(
        `[ReviewService] updateProductReview failed for ${reviewId}:`,
        err,
      );

      return { ok: false, error: message };
    }
  }


  /**
   * Fetch lightweight product ratings summary (GET /reviews/ratings/products).
   * Normalizes backend Prisma groupBy format (_avg, _count) into compatible entries.
   * Falls back to Supabase only on genuine backend/network unavailability.
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

      const items: RatingSummaryItem[] = [];
      rawList.forEach((entry: any) => {
        const pId = Number(entry.product_id);
        const avg = entry._avg?.rating != null ? Number(entry._avg.rating) : Number(entry.rating) || 0;
        const count = entry._count?.id != null ? Number(entry._count.id) : 1;

        if (count > 0 && avg > 0) {
          for (let i = 0; i < count; i++) {
            items.push({ product_id: pId, rating: avg });
          }
        } else if (avg > 0) {
          items.push({ product_id: pId, rating: avg });
        }
      });

      return items;
    } catch (err: unknown) {
      if (!isNetworkOrUnavailable(err)) {
        console.warn("[ReviewService] Backend /reviews/ratings/products application error:", err);
        return [];
      }

      console.warn("[ReviewService] Backend unavailable, attempting Supabase fallback for product ratings summary:", err);
      try {
        const { data, error: sbError } = await supabase
          .from("product_reviews")
          .select("product_id, rating")
          .eq("status", "approved");

        if (sbError || !data) {
          console.warn("[ReviewService] Supabase product ratings summary fallback error:", sbError);
          return [];
        }

        return data.map((r: any) => ({
          product_id: Number(r.product_id),
          rating: Number(r.rating) || 0,
        }));
      } catch (fallbackErr) {
        console.warn("[ReviewService] Supabase product ratings fallback unexpected error:", fallbackErr);
        return [];
      }
    }
  }
}

export const reviewService = new ReviewService();
