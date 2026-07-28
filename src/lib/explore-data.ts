import { supabase } from "@/integrations/supabase/client";
import type { CourseCard } from "./landing-data";

export const CATEGORIES = [
  "All",
  "Robotics",
  "AI & ML",
  "Electronics",
  "IoT",
  "Programming",
] as const;
export type Category = string;

export async function fetchCategories(): Promise<string[]> {
  try {
    const { data } = await supabase.from("categories").select("name").order("name");
    if (data && data.length > 0) return ["All", ...(data as any[]).map((c) => c.name)];
  } catch {}
  return [...CATEGORIES]; // fallback to static list
}

export const SORTS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "rating", label: "Top Rated" },
] as const;
export type SortValue = (typeof SORTS)[number]["value"];

export type ExploreFilters = {
  search: string;
  category: Category;
  sort: SortValue;
};

export const FALLBACK: CourseCard[] = [
  {
    id: "demo-1",
    title: "Build Your First Robot with Arduino",
    category: "Robotics",
    level: "Beginner",
    price: 1499,
    original_price: 2999,
    is_free: false,
    thumbnail_url: "/course-thumbnails/arduino-uno-q-spotted-in-the-wild-v0-badkp3lmibwf1.webp",
    rating: 4.9,
    total_reviews: 312,
    instructor_name: "Dr. Aarav Mehta",
    gst_rate: 18,
  },
  {
    id: "demo-2",
    title: "AI for Curious Minds — Python & ML",
    category: "AI & ML",
    level: "Intermediate",
    price: 1999,
    original_price: 3499,
    is_free: false,
    thumbnail_url: "/course-thumbnails/aiml003-1024x640.webp",
    rating: 4.8,
    total_reviews: 248,
    instructor_name: "Priya Sharma",
    gst_rate: 18,
  },
  {
    id: "demo-3",
    title: "IoT Smart Home Projects",
    category: "IoT",
    level: "Intermediate",
    price: 0,
    original_price: null,
    is_free: true,
    thumbnail_url: "/course-thumbnails/EC-IoT-Internet-of-Things-750.webp",
    rating: 4.7,
    total_reviews: 186,
    instructor_name: "Rohan Kapoor",
    gst_rate: 18,
  },
  {
    id: "demo-4",
    title: "Electronics 101 — Circuits to PCBs",
    category: "Electronics",
    level: "Beginner",
    price: 999,
    original_price: 1999,
    is_free: false,
    thumbnail_url: "/course-thumbnails/embedded-systems.webp",
    rating: 4.8,
    total_reviews: 421,
    instructor_name: "Ananya Iyer",
    gst_rate: 18,
  },
  {
    id: "demo-5",
    title: "Python from Zero to Hero",
    category: "Programming",
    level: "Beginner",
    price: 1299,
    original_price: 2499,
    is_free: false,
    thumbnail_url: "/course-thumbnails/7023609_a203.webp",
    rating: 4.9,
    total_reviews: 512,
    instructor_name: "Dr. Aarav Mehta",
    gst_rate: 18,
  },
  {
    id: "demo-6",
    title: "ROS2 & Autonomous Mobile Robots",
    category: "Robotics",
    level: "Advanced",
    price: 2499,
    original_price: 4999,
    is_free: false,
    thumbnail_url: "/course-thumbnails/9XFcF1OnPoDv83Zqg0tI1lP144RY8wzVckh9Os7v.webp",
    rating: 4.9,
    total_reviews: 154,
    instructor_name: "Vikram Malhotra",
    gst_rate: 18,
  },
  {
    id: "demo-7",
    title: "Computer Vision with OpenCV & PyTorch",
    category: "AI & ML",
    level: "Intermediate",
    price: 2199,
    original_price: 3999,
    is_free: false,
    thumbnail_url: "/course-thumbnails/photo-1674027444485-cec3da58eef4.avif",
    rating: 4.8,
    total_reviews: 290,
    instructor_name: "Priya Sharma",
    gst_rate: 18,
  },
  {
    id: "demo-8",
    title: "Raspberry Pi Industrial Edge AI",
    category: "IoT",
    level: "Advanced",
    price: 0,
    original_price: null,
    is_free: true,
    thumbnail_url: "/course-thumbnails/banner_strange_pi_projects-768x512.webp",
    rating: 4.6,
    total_reviews: 211,
    instructor_name: "Rohan Kapoor",
    gst_rate: 18,
  },
];

function applyClientFilters(list: CourseCard[], filters: ExploreFilters): CourseCard[] {
  let out = list;
  if (filters.category !== "All") {
    out = out.filter((c) => c.category === filters.category);
  }
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    out = out.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.instructor_name?.toLowerCase().includes(q),
    );
  }
  switch (filters.sort) {
    case "newest":
      out = [...out].reverse();
      break;
    case "price-asc":
      out = [...out].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      break;
    case "rating":
      out = [...out].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "popular":
    default:
      out = [...out].sort((a, b) => (b.total_reviews ?? 0) - (a.total_reviews ?? 0));
  }
  return out;
}

export async function fetchExploreCourses(filters: ExploreFilters): Promise<CourseCard[]> {
  try {
    let q = supabase
      .from("courses")
      .select("id, title, category, level, price, is_free, thumbnail_url, created_at")
      .eq("is_published", true);

    if (filters.category !== "All") q = q.eq("category", filters.category);
    if (filters.search.trim()) q = q.ilike("title", `%${filters.search.trim()}%`);

    switch (filters.sort) {
      case "newest":
        q = q.order("created_at", { ascending: false });
        break;
      case "price-asc":
        q = q.order("price", { ascending: true });
        break;
      case "rating":
      case "popular":
      default:
        q = q.order("created_at", { ascending: false });
    }

    const { data, error } = await q.limit(48);
    if (error || !data) return [];

    return data.map((c: any) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      level: c.level,
      price: c.price,
      original_price: null,
      gst_rate: c.gst_rate ?? 18,
      is_free: c.is_free,
      thumbnail_url: c.thumbnail_url,
      rating: c.rating == null ? null : Number(c.rating),
      total_reviews: c.total_reviews == null ? null : Number(c.total_reviews),
      instructor_name: null,
    }));
  } catch (err: any) {
    console.error("[fetchExploreCourses] Caught error:", err);
    return applyClientFilters(FALLBACK, filters);
  }
}

// ============ Course Detail ============

export type CourseDetail = CourseCard & {
  description: string | null;
  enrolled_count: number;
  duration_hours: number | null;
  what_you_will_learn: string[];
  instructor_id: string | null;
  instructor_bio: string | null;
  instructor_avatar: string | null;
};

export type Lesson = {
  id: string;
  title: string;
  duration_minutes: number | null;
  position: number;
};

export type Module = {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string | null;
  user_avatar: string | null;
};

const DEMO_DETAIL = (id: string): CourseDetail => {
  const base = FALLBACK.find((c) => c.id === id) ?? FALLBACK[0];
  return {
    ...base,
    id,
    description:
      "A hands-on, project-based journey through real-world hardware and code. " +
      "You'll build, break, and rebuild — the way real engineers learn.",
    enrolled_count: 1248,
    duration_hours: 18,
    what_you_will_learn: [
      "Fundamentals taught through guided projects",
      "Industry-grade tools and workflows",
      "Debugging mindset and troubleshooting",
      "Portfolio-ready capstone project",
      "Lifetime access to course updates",
      "Certificate of completion",
    ],
    instructor_id: null,
    instructor_bio:
      "Mentor with 10+ years building products in robotics & AI. Passionate about teaching the next generation of makers.",
    instructor_avatar: null,
  };
};

export const DEMO_MODULES: Module[] = [
  {
    id: "m1",
    title: "Getting Started",
    position: 1,
    lessons: [
      { id: "l1", title: "Welcome & Course Overview", duration_minutes: 6, position: 1 },
      { id: "l2", title: "Setting Up Your Workspace", duration_minutes: 12, position: 2 },
      { id: "l3", title: "Your First Project", duration_minutes: 18, position: 3 },
    ],
  },
  {
    id: "m2",
    title: "Core Concepts",
    position: 2,
    lessons: [
      { id: "l4", title: "Understanding the Fundamentals", duration_minutes: 22, position: 1 },
      { id: "l5", title: "Hands-on Lab #1", duration_minutes: 30, position: 2 },
      { id: "l6", title: "Common Pitfalls", duration_minutes: 14, position: 3 },
    ],
  },
  {
    id: "m3",
    title: "Building Real Projects",
    position: 3,
    lessons: [
      { id: "l7", title: "Project: Mini Build", duration_minutes: 40, position: 1 },
      { id: "l8", title: "Iterating & Debugging", duration_minutes: 25, position: 2 },
      { id: "l9", title: "Polishing Your Work", duration_minutes: 20, position: 3 },
    ],
  },
  {
    id: "m4",
    title: "Capstone",
    position: 4,
    lessons: [
      { id: "l10", title: "Capstone Brief", duration_minutes: 10, position: 1 },
      { id: "l11", title: "Capstone Build", duration_minutes: 60, position: 2 },
      { id: "l12", title: "Showcase & Next Steps", duration_minutes: 15, position: 3 },
    ],
  },
];

const DEMO_REVIEWS: Review[] = [
  {
    id: "r1",
    rating: 5,
    comment: "Easily the best course I've taken — projects feel real, not theoretical.",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    user_name: "Ishaan R.",
    user_avatar: null,
  },
  {
    id: "r2",
    rating: 5,
    comment: "Mentor is super clear and patient. The capstone alone is worth it.",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    user_name: "Meera J.",
    user_avatar: null,
  },
  {
    id: "r3",
    rating: 4,
    comment: "Loved it — would have liked more bonus material at the end.",
    created_at: new Date(Date.now() - 86400000 * 21).toISOString(),
    user_name: "Karan S.",
    user_avatar: null,
  },
];

export async function fetchCourseDetail(id: string): Promise<CourseDetail> {
  console.log("[fetchCourseDetail] Fetching course:", id);

  try {
    const isNumeric = /^\d+$/.test(id);
    let q = supabase
      .from("courses")
      .select(
        "id, title, category, level, price, gst_rate, is_free, thumbnail_url, description, slug, created_at, is_published",
      )
      .eq("is_published", true);

    if (isNumeric) {
      q = q.eq("id", Number(id));
    } else {
      q = q.eq("slug", id);
    }

    const { data, error } = await q.maybeSingle();

    console.log("[fetchCourseDetail] Supabase response:", { data, error });

    if (error || !data) {
      console.error("[fetchCourseDetail] Error or no data, using demo:", error);
      return DEMO_DETAIL(id);
    }

    const c: any = data;

    // Fetch actual enrollment count
    const { count: enrollCount } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", c.id);

    const result = {
      id: String(c.id),
      title: c.title,
      category: c.category,
      level: c.level,
      price: c.price ?? 0,
      original_price: null,
      gst_rate: c.gst_rate ?? 18,
      is_free: c.is_free ?? false,
      thumbnail_url: c.thumbnail_url,
      rating: c.rating == null ? null : Number(c.rating),
      total_reviews: c.total_reviews == null ? null : Number(c.total_reviews),
      instructor_name: null,
      description: c.description ?? "No description available.",
      enrolled_count: enrollCount ?? 0,
      duration_hours: null,
      what_you_will_learn: [
        "Hands-on project-based learning",
        "Industry-relevant skills",
        "Certificate of completion",
        "Lifetime access to course materials",
      ],
      instructor_id: null,
      instructor_bio: null,
      instructor_avatar: null,
    };

    console.log("[fetchCourseDetail] Returning course:", result);
    return result;
  } catch (err) {
    console.error("[fetchCourseDetail] Caught exception:", err);
    return DEMO_DETAIL(id);
  }
}

export async function fetchCourseModules(courseId: string): Promise<Module[]> {
  console.log("[fetchCourseModules] Fetching modules for course:", courseId);

  if (courseId.startsWith("demo-")) {
    console.log("[fetchCourseModules] Resolving from DEMO_MODULES for course:", courseId);
    return DEMO_MODULES;
  }

  try {
    const targetCourseId = await resolveCourseId(courseId);
    // Step 1: Fetch modules for the course
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("id, title, order_index")
      .eq("course_id", targetCourseId)
      .order("order_index", { ascending: true });

    console.log("[fetchCourseModules] Modules query response:", { modules, modulesError });

    if (modulesError) {
      console.error("[fetchCourseModules] Modules query error:", modulesError);
      return [];
    }

    if (!modules || modules.length === 0) {
      console.log("[fetchCourseModules] No modules found for course");
      return [];
    }

    // Step 2: Fetch all lessons for these modules in one query
    const moduleIds = modules.map((m) => m.id);
    console.log("[fetchCourseModules] Fetching lessons for module IDs:", moduleIds);

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, module_id, title, duration_secs, order_index")
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true });

    console.log("[fetchCourseModules] Lessons query response:", {
      lessonsCount: lessons?.length ?? 0,
      lessonsError,
    });

    if (lessonsError) {
      console.error("[fetchCourseModules] Lessons query error:", lessonsError);
    }

    // Step 3: Combine modules with their lessons
    const result = modules.map((m) => ({
      id: String(m.id),
      title: m.title,
      position: (m as any).order_index ?? 0,
      lessons: (lessons ?? [])
        .filter((l) => String(l.module_id) === String(m.id))
        .map((l) => ({
          id: String(l.id),
          title: l.title,
          duration_minutes: (l as any).duration_secs
            ? Math.round((l as any).duration_secs / 60)
            : null,
          position: (l as any).order_index ?? 0,
        }))
        .sort((a, b) => a.position - b.position),
    }));

    console.log(
      "[fetchCourseModules] Final result:",
      result.map((m) => `Module "${m.title}": ${m.lessons.length} lessons`),
    );

    return result;
  } catch (err) {
    console.error("[fetchCourseModules] Caught exception:", err);
    return [];
  }
}

export async function fetchCourseReviews(courseId: string): Promise<Review[]> {
  try {
    const targetCourseId = await resolveCourseId(courseId);
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, user_id")
      .eq("course_id", targetCourseId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !reviews || reviews.length === 0) return [];

    const userIds = Array.from(new Set(reviews.map((r) => r.user_id))).filter(Boolean);
    let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.rpc("get_approved_reviewer_profiles", {
        p_user_ids: userIds,
      });
      if (profiles) {
        (profiles as any[]).forEach((p) => {
          profilesMap[p.id] = p;
        });
      }
    }

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      user_name: profilesMap[r.user_id]?.full_name ?? null,
      user_avatar: profilesMap[r.user_id]?.avatar_url ?? null,
    }));
  } catch (err) {
    console.error("[fetchCourseReviews] Error:", err);
    return [];
  }
}

export async function fetchMyCourseReview(
  userId: string,
  courseId: string,
): Promise<{ id: string; rating: number; comment: string | null; status: "pending" | "approved" | "rejected" } | null> {
  if (!userId) return null;
  try {
    const targetCourseId = await resolveCourseId(courseId);
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, status")
      .eq("user_id", userId)
      .eq("course_id", targetCourseId)
      .maybeSingle();

    if (error || !data) return null;
    return data as any;
  } catch {
    return null;
  }
}

export async function submitCourseReview(
  userId: string,
  courseId: string,
  rating: number,
  comment: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!userId) return { ok: false, error: "Please sign in to submit a review" };
  if (!rating || rating < 1 || rating > 5) return { ok: false, error: "Please select a star rating (1-5)" };

  try {
    // 1. Server-side verification: check enrollment status
    const enrolled = await isEnrolled(userId, courseId);
    if (!enrolled) {
      return { ok: false, error: "Only enrolled students can review this course" };
    }

    // 2. Resolve course numeric ID
    const targetCourseId = await resolveCourseId(courseId);

    // 3. Perform insert into reviews table
    const { error } = await supabase.from("reviews").upsert(
      {
        user_id: userId,
        course_id: targetCourseId,
        rating,
        comment: comment.trim() || null,
        status: "pending",
      },
      { onConflict: "user_id,course_id" },
    );

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "You have already submitted a review for this course." };
      }
      throw error;
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[submitCourseReview] Insert failed:", err);
    return { ok: false, error: err?.message || "Could not submit review." };
  }
}

export async function resolveCourseId(courseId: string | number): Promise<string | number> {
  const str = String(courseId);
  if (typeof courseId === "number" || /^\d+$/.test(str) || str.startsWith("demo-")) {
    return /^\d+$/.test(str) ? Number(str) : courseId;
  }
  try {
    const { data } = await supabase.from("courses").select("id").eq("slug", str).maybeSingle();
    if (data?.id) return data.id;
  } catch {}
  return courseId;
}

export async function enrollInCourse(
  userId: string,
  courseId: string | number,
  isFree: boolean = false,
): Promise<{ ok: boolean; error?: string }> {
  console.log("[enrollInCourse] Starting enrollment:", { userId, courseId, isFree });

  // Convert courseId to string for comparison
  const courseIdStr = String(courseId);

  if (courseIdStr.startsWith("demo-")) {
    try {
      const key = `demo_enrollments_${userId}`;
      const current = JSON.parse(localStorage.getItem(key) || "[]");
      if (!current.includes(courseIdStr)) {
        current.push(courseIdStr);
      }
      localStorage.setItem(key, JSON.stringify(current));
      console.log("[enrollInCourse] Demo enrollment successful");
      return { ok: true };
    } catch (e: any) {
      console.error("[enrollInCourse] Demo enrollment failed:", e);
      return { ok: false, error: e?.message ?? "Failed to enroll" };
    }
  }

  try {
    const targetCourseId = await resolveCourseId(courseId);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    // Only insert columns that exist in the enrollments table.
    // (payment_status and status are NOT columns in this table — do not add them.)
    const enrollmentData = {
      user_id: userId,
      course_id: targetCourseId,
      enrolled_at: new Date().toISOString(),
      // Same 1-year access window the mobile app enforces
      expires_at: expiresAt.toISOString(),
    };

    console.log("[enrollInCourse] Calling Supabase insert with:", enrollmentData);

    const { error } = await supabase.from("enrollments").insert(enrollmentData);

    if (error) {
      console.error("[enrollInCourse] Supabase error:", error);
      return { ok: false, error: "Could not process enrollment. Please try again." };
    }

    console.log("[enrollInCourse] Enrollment successful");
    return { ok: true };
  } catch (e: any) {
    console.error("[enrollInCourse] Caught exception:", e);
    return { ok: false, error: "Failed to enroll. Please try again." };
  }
}

export async function isEnrolled(userId: string, courseId: string | number): Promise<boolean> {
  // Convert courseId to string for comparison
  const courseIdStr = String(courseId);

  if (courseIdStr.startsWith("demo-")) {
    try {
      const key = `demo_enrollments_${userId}`;
      const current = JSON.parse(localStorage.getItem(key) || "[]");
      return current.includes(courseIdStr);
    } catch {
      return false;
    }
  }
  try {
    const targetCourseId = await resolveCourseId(courseId);
    const { data } = await supabase
      .from("enrollments")
      .select("id, expires_at")
      .eq("user_id", userId)
      .eq("course_id", targetCourseId)
      .maybeSingle();
    if (!data) return false;
    // 1-year access window (shared with the mobile app): a lapsed
    // enrollment no longer grants lesson access.
    const expiresAt = (data as { expires_at?: string | null }).expires_at;
    if (expiresAt && new Date(expiresAt) < new Date()) return false;
    return true;
  } catch {
    return false;
  }
}
