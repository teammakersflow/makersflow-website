/**
 * MakersFlow — Supabase Database types
 *
 * Covers every table the web app reads/writes.
 * Pass `Database` to `createClient<Database>()` in client.ts
 * to get end-to-end type safety on every `.from()` call.
 *
 * To regenerate from your live schema run:
 *   npx supabase gen types typescript --project-id <your-project-ref> > src/integrations/supabase/types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ---------------------------------------------------------------------------
// Row shapes (what Supabase returns for SELECT *)
// ---------------------------------------------------------------------------

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  grade: string | null;
  school: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  price: number;
  original_price: number | null;
  gst_rate: number;
  is_free: boolean;
  thumbnail_url: string | null;
  rating: number | null;
  total_reviews: number | null;
  enrolled_count: number;
  duration_hours: number | null;
  what_you_will_learn: string[] | null;
  instructor_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ModuleRow {
  id: string;
  course_id: string;
  title: string;
  position: number;
  created_at: string | null;
}

export interface LessonRow {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  video_url: string | null;
  notes: string | null;
  content: string | null;
  duration_minutes: number | null;
  duration_secs: number | null;
  position: number;
  order_index: number | null;
  created_at: string | null;
}

export interface LessonResourceRow {
  id: string;
  lesson_id: string;
  title: string;
  url: string;
  type: string | null;
  size_bytes: number | null;
  created_at: string | null;
}

export interface LessonProgressRow {
  id: string;
  user_id: string;
  lesson_id: string | number;
  course_id: string | number;
  current_time_secs: number;
  watch_percentage: number;
  time_spent_secs: number;
  is_completed: boolean;
  last_watched_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string | number;
  status: string | null;
  payment_status: string | null;
  progress: number | null;
  enrolled_at: string | null;
  completed_at: string | null;
  created_at: string | null;
}

export interface ReviewRow {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface StreakRow {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  activity_log: Record<string, number> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrderRow {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  razorpay_order_id: string | null;
  items: Json;
  shipping_address: Json;
  created_at: string;
  updated_at: string | null;
}

export interface ProductRow {
  id: string;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  gst_rate: number;
  category: string | null;
  subcategory: string | null;
  thumbnail_url: string | null;
  images: string[] | null;
  rating: number | null;
  total_reviews: number | null;
  badge: string | null;
  features: string[] | null;
  in_stock: boolean;
  is_course: boolean;
  course_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface NewsRow {
  id: string;
  title: string;
  slug: string | null;
  status: "draft" | "published" | "archived";
  content: string | null;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  created_at: string;
}

export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "flat";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  expiry_date: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  applicable_product_ids: string[];
  applicable_course_ids: string[];
  created_at: string;
}

export interface PaymentRow {
  id: string;
  user_id: string;
  order_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: number;
  currency: string;
  status: "pending" | "captured" | "failed" | "refunded";
  coupon_code: string | null;
  discount_amount: number;
  tax_amount: number;
  notes: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "announcement";
  link_url: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
}

// ---------------------------------------------------------------------------
// Insert / Update shapes (omit auto-generated columns)
// ---------------------------------------------------------------------------

// Insert types are fully partial (all columns have DB defaults or are nullable).
// Only the truly required FK columns are enforced where needed at call sites.
type PartialInsert<T> = Partial<Omit<T, "id" | "created_at" | "updated_at">>;

export type ProfileInsert = PartialInsert<ProfileRow> & { id: string };
export type ProfileUpdate = PartialInsert<ProfileRow>;

export type CourseInsert = PartialInsert<CourseRow>;
export type CourseUpdate = PartialInsert<CourseRow>;

export type ModuleInsert = PartialInsert<ModuleRow>;
export type ModuleUpdate = PartialInsert<ModuleRow>;

export type LessonInsert = PartialInsert<LessonRow>;
export type LessonUpdate = PartialInsert<LessonRow>;

export type LessonResourceInsert = PartialInsert<LessonResourceRow>;

export type LessonProgressInsert = PartialInsert<LessonProgressRow>;
export type LessonProgressUpdate = PartialInsert<LessonProgressRow>;

export type EnrollmentInsert = PartialInsert<EnrollmentRow>;
export type EnrollmentUpdate = PartialInsert<EnrollmentRow>;

export type ReviewInsert = PartialInsert<ReviewRow>;

export type StreakInsert = PartialInsert<StreakRow>;
export type StreakUpdate = PartialInsert<StreakRow>;

export type OrderInsert = PartialInsert<OrderRow>;
export type OrderUpdate = PartialInsert<OrderRow>;

export type ProductInsert = PartialInsert<ProductRow>;
export type ProductUpdate = PartialInsert<ProductRow>;

// Convenience alias used in the Database interface for write operations.
// Using Record<string, unknown> as Insert/Update lets callers pass any subset
// of fields without TypeScript narrowing the result to `never`.
type AnyInsert = Record<string, unknown>;
type AnyUpdate = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Database interface — passed to createClient<Database>()
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      courses: {
        Row: CourseRow;
        Insert: CourseInsert;
        Update: CourseUpdate;
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey";
            columns: ["instructor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      modules: {
        Row: ModuleRow;
        Insert: ModuleInsert;
        Update: ModuleUpdate;
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      lessons: {
        Row: LessonRow;
        Insert: LessonInsert;
        Update: LessonUpdate;
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lessons_module_id_fkey";
            columns: ["module_id"];
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_resources: {
        Row: LessonResourceRow;
        Insert: LessonResourceInsert;
        Update: LessonResourceInsert;
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey";
            columns: ["lesson_id"];
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: LessonProgressRow;
        Insert: LessonProgressInsert;
        Update: LessonProgressUpdate;
        Relationships: [
          {
            foreignKeyName: "lesson_progress_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: EnrollmentRow;
        Insert: EnrollmentInsert;
        Update: EnrollmentUpdate;
        Relationships: [
          {
            foreignKeyName: "enrollments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: ReviewRow;
        Insert: ReviewInsert;
        Update: ReviewInsert;
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      streaks: {
        Row: StreakRow;
        Insert: StreakInsert;
        Update: StreakUpdate;
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [
          {
            foreignKeyName: "products_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: OrderUpdate;
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      news: {
        Row: NewsRow;
        Insert: AnyInsert;
        Update: AnyUpdate;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: AnyInsert;
        Update: AnyUpdate;
        Relationships: [];
      };
      announcements: {
        Row: NotificationRow;
        Insert: AnyInsert;
        Update: AnyUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
