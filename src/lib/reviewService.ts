
/**
 * MakersFlow Review Service
 * Canonical data layer for course and product reviews.
 * All review data is handled through the NestJS backend.
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

type ReviewRecord = {
  id: string | number;
  rating: number | string;
  comment?: string | null;
  created_at?: string | null;
  user_id?: string | number;
  status?: "pending" | "approved" | "rejected" | string;
  users?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  user?: {
    full_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  } | null;
};

class ReviewService {
  // --------------------------------------------------
  // SHARED HELPERS
  // --------------------------------------------------

  /**
   * Handle API responses that may contain either a data
   * property or the response array/object directly.
   */
  private getResponseData<T>(response: ApiResponse<T> | T): T | undefined {
    if (
      response !== null &&
      typeof response === "object" &&
      "data" in response
    ) {
      return (response as ApiResponse<T>).data;
    }

    return response as T;
  }

  /**
   * Validate review input before sending it to the backend.
   * The backend must also validate these fields.
   */
  private validateReviewInput(
    rating: number,
    comment?: string,
  ): string | null {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return "Please select a whole-number star rating from 1 to 5.";
    }

    if (comment !== undefined && typeof comment !== "string") {
      return "Comment must be text.";
    }

    return null;
  }

  /**
   * Normalize a review returned by the NestJS API.
   * Do not invent a rating if the API returns invalid data.
   */
  private normalizeReview<T extends CourseReview | ProductReview>(
    review: ReviewRecord,
    productReview = false,
  ): T {
    const userName =
      review.users?.full_name ??
      review.user?.full_name ??
      (productReview && review.user?.email
        ? review.user.email.split("@")[0]
        : productReview
          ? "Verified Buyer"
          : null);

    return {
      id: String(review.id),
      rating: Number(review.rating),
      comment: review.comment ?? null,
      created_at: review.created_at ?? new Date().toISOString(),
      user_id: String(review.user_id ?? ""),
      user_name: userName,
      user_avatar: review.users?.avatar_url ?? review.user?.avatar_url ?? null,
      status: review.status,
    } as T;
  }

  /**
   * Normalize a review belonging to the authenticated user.
   */
  private normalizeMyReview(
    review: ReviewRecord | null | undefined,
  ): MyReview | null {
    if (!review || review.id === undefined || review.id === null) {
      return null;
    }

    const status = review.status ?? "pending";

    if (
      status !== "pending" &&
      status !== "approved" &&
      status !== "rejected"
    ) {
      console.warn("[ReviewService] Unexpected review status:", status);
      return null;
    }

    return {
      id: String(review.id),
      rating: Number(review.rating),
      comment: review.comment ?? null,
      status,
      created_at: review.created_at ?? new Date().toISOString(),
    };
  }

  /**
   * Normalize Prisma groupBy rating summaries.
   *
   * The backend may return:
   * {
   *   course_id: 1,
   *   _avg: { rating: 4.5 },
   *   _count: { id: 10 }
   * }
   *
   * The returned array preserves compatibility with existing
   * frontend code that calculates an average from rating entries.
   */
  private normalizeRatingSummary(
    rawList: unknown,
    entity: "course" | "product",
  ): RatingSummaryItem[] {
    if (!Array.isArray(rawList)) {
      return [];
    }

    const items: RatingSummaryItem[] = [];

    rawList.forEach((entry: any) => {
      if (!entry || typeof entry !== "object") {
        return;
      }

      const id = Number(
        entity === "course" ? entry.course_id : entry.product_id,
      );

      const average =
        entry._avg?.rating != null
          ? Number(entry._avg.rating)
          : Number(entry.rating);

      const count =
        entry._count?.id != null
          ? Number(entry._count.id)
          : 1;

      if (
        !Number.isFinite(id) ||
        !Number.isFinite(average) ||
        average < 1 ||
        average > 5
      ) {
        return;
      }

      if (Number.isFinite(count) && count > 0) {
        for (let i = 0; i < Math.floor(count); i++) {
          items.push(
            entity === "course"
              ? { course_id: id, rating: average }
              : { product_id: id, rating: average },
          );
        }
      } else if (entry._count === undefined) {
        items.push(
          entity === "course"
            ? { course_id: id, rating: average }
            : { product_id: id, rating: average },
        );
      }
    });

    return items;
  }

  // --------------------------------------------------
  // COURSE REVIEWS
  // --------------------------------------------------

  /**
   * Fetch public course reviews.
   *
   * GET /reviews/course/:courseId
   *
   * The backend must return approved reviews only.
   */
  public async fetchCourseReviews(
    courseId: string | number,
  ): Promise<CourseReview[]> {
    const courseIdStr = String(courseId).trim();

    if (!courseIdStr) {
      return [];
    }

    let targetCourseId: string | number = courseIdStr;

    try {
      targetCourseId = await courseService.resolveCourseId(courseIdStr);
    } catch (error) {
      console.warn(
        "[ReviewService] Could not resolve course ID; using supplied ID.",
        error,
      );
    }

    try {
      const response = await apiClient.get<any>(
        `/reviews/course/${encodeURIComponent(String(targetCourseId))}`,
      );

      const data = this.getResponseData<unknown>(response);
      const reviews = Array.isArray(data) ? data : [];

      return reviews.map((review: ReviewRecord) =>
        this.normalizeReview<CourseReview>(review),
      );
    } catch (error) {
      console.error(
        `[ReviewService] Failed to fetch course reviews for ${courseId}:`,
        error,
      );

      return [];
    }
  }

  /**
   * Fetch the authenticated user's review for a course.
   *
   * GET /reviews/course/:courseId/my
   *
   * The backend must identify the user using the JWT.
   */
  public async fetchMyCourseReview(
    courseId: string | number,
  ): Promise<MyReview | null> {
    const courseIdStr = String(courseId).trim();

    if (!courseIdStr) {
      return null;
    }

    let targetCourseId: string | number = courseIdStr;

    try {
      targetCourseId = await courseService.resolveCourseId(courseIdStr);
    } catch (error) {
      console.warn(
        "[ReviewService] Could not resolve course ID; using supplied ID.",
        error,
      );
    }

    try {
      const response = await apiClient.get<any>(
        `/reviews/course/${encodeURIComponent(String(targetCourseId))}/my`,
      );

      const data = this.getResponseData<any>(response);

      return this.normalizeMyReview(data);
    } catch (error) {
      console.error(
        `[ReviewService] Failed to fetch my course review for ${courseId}:`,
        error,
      );

      return null;
    }
  }

  /**
   * Submit a course review.
   *
   * POST /reviews/course/:courseId
   *
   * The authenticated user ID must come from the backend JWT,
   * never from a user ID supplied by the frontend.
   */
  public async submitCourseReview(
    courseId: string | number,
    rating: number,
    comment?: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const courseIdStr = String(courseId).trim();

    if (!courseIdStr) {
      return { ok: false, error: "Invalid course ID." };
    }

    const validationError = this.validateReviewInput(rating, comment);

    if (validationError) {
      return { ok: false, error: validationError };
    }

    let targetCourseId: string | number = courseIdStr;

    try {
      targetCourseId = await courseService.resolveCourseId(courseIdStr);
    } catch (error) {
      console.warn(
        "[ReviewService] Could not resolve course ID; using supplied ID.",
        error,
      );
    }

    try {
      await apiClient.post(
        `/reviews/course/${encodeURIComponent(String(targetCourseId))}`,
        {
          rating,
          comment: comment?.trim() || undefined,
        },
      );

      return { ok: true };
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Could not submit course review.";

      console.error(
        `[ReviewService] Failed to submit course review for ${courseId}:`,
        error,
      );

      return {
        ok: false,
        error: Array.isArray(message) ? message.join(", ") : String(message),
      };
    }
  }

  /**
   * Fetch course rating summaries.
   *
   * GET /reviews/ratings/courses
   *
   * The backend must calculate summaries using approved reviews only.
   */
  public async fetchCourseRatingsSummary(): Promise<RatingSummaryItem[]> {
    try {
      const response = await apiClient.get<any>(
        "/reviews/ratings/courses",
      );

      const data = this.getResponseData<unknown>(response);

      return this.normalizeRatingSummary(data, "course");
    } catch (error) {
      console.error(
        "[ReviewService] Failed to fetch course rating summaries:",
        error,
      );

      return [];
    }
  }

  // --------------------------------------------------
  // PRODUCT REVIEWS
  // --------------------------------------------------

  /**
   * Fetch public product reviews.
   *
   * GET /reviews/product/:productId
   *
   * The backend must return approved reviews only.
   */
  public async fetchProductReviews(
    productId: string | number,
  ): Promise<ProductReview[]> {
    const productIdStr = String(productId).trim();

    if (!productIdStr) {
      return [];
    }

    try {
      const response = await apiClient.get<any>(
        `/reviews/product/${encodeURIComponent(productIdStr)}`,
      );

      const data = this.getResponseData<unknown>(response);
      const reviews = Array.isArray(data) ? data : [];

      return reviews.map((review: ReviewRecord) =>
        this.normalizeReview<ProductReview>(review, true),
      );
    } catch (error) {
      console.error(
        `[ReviewService] Failed to fetch product reviews for ${productId}:`,
        error,
      );

      return [];
    }
  }

  /**
   * Fetch the authenticated user's review for a product.
   *
   * GET /reviews/product/:productId/my
   *
   * The backend must identify the user using the JWT.
   */
  public async fetchMyProductReview(
    productId: string | number,
  ): Promise<MyReview | null> {
    const productIdStr = String(productId).trim();

    if (!productIdStr) {
      return null;
    }

    try {
      const response = await apiClient.get<any>(
        `/reviews/product/${encodeURIComponent(productIdStr)}/my`,
      );

      const data = this.getResponseData<any>(response);

      return this.normalizeMyReview(data);
    } catch (error) {
      console.error(
        `[ReviewService] Failed to fetch my product review for ${productId}:`,
        error,
      );

      return null;
    }
  }

  /**
   * Submit a product review.
   *
   * POST /reviews/product/:productId
   *
   * The authenticated user ID must come from the backend JWT,
   * never from a user ID supplied by the frontend.
   */
  public async submitProductReview(
    productId: string | number,
    rating: number,
    comment?: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const productIdStr = String(productId).trim();

    if (!productIdStr) {
      return { ok: false, error: "Invalid product ID." };
    }

    const validationError = this.validateReviewInput(rating, comment);

    if (validationError) {
      return { ok: false, error: validationError };
    }

    try {
      await apiClient.post(
        `/reviews/product/${encodeURIComponent(productIdStr)}`,
        {
          rating,
          comment: comment?.trim() || undefined,
        },
      );

      return { ok: true };
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Could not submit product review.";

      console.error(
        `[ReviewService] Failed to submit product review for ${productId}:`,
        error,
      );

      return {
        ok: false,
        error: Array.isArray(message) ? message.join(", ") : String(message),
      };
    }
  }

  /**
   * Update an existing product review.
   *
   * PATCH /reviews/:id
   *
   * The backend must verify ownership and set the edited review
   * back to pending moderation.
   */
  public async updateProductReview(
    reviewId: string,
    rating: number,
    comment?: string,
  ): Promise<{ ok: boolean; error?: string }> {
    if (!reviewId.trim()) {
      return { ok: false, error: "Invalid review ID." };
    }

    const validationError = this.validateReviewInput(rating, comment);

    if (validationError) {
      return { ok: false, error: validationError };
    }

    try {
      await apiClient.patch(
        `/reviews/${encodeURIComponent(reviewId)}`,
        {
          rating,
          comment: comment?.trim() ?? "",
        },
      );

      return { ok: true };
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Could not update product review.";

      console.error(
        `[ReviewService] Failed to update product review ${reviewId}:`,
        error,
      );

      return {
        ok: false,
        error: Array.isArray(message) ? message.join(", ") : String(message),
      };
    }
  }

  /**
   * Fetch product rating summaries.
   *
   * GET /reviews/ratings/products
   *
   * The backend must calculate summaries using approved reviews only.
   */
  public async fetchProductRatingsSummary(): Promise<RatingSummaryItem[]> {
    try {
      const response = await apiClient.get<any>(
        "/reviews/ratings/products",
      );

      const data = this.getResponseData<unknown>(response);

      return this.normalizeRatingSummary(data, "product");
    } catch (error) {
      console.error(
        "[ReviewService] Failed to fetch product rating summaries:",
        error,
      );

      return [];
    }
  }
}

export const reviewService = new ReviewService();
