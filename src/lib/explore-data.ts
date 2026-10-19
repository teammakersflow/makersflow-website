import { categoryService } from "@/lib/categoryService";
import { courseService } from "@/lib/courseService";
import { enrollmentService } from "@/lib/enrollmentService";
import { reviewService } from "@/lib/reviewService";
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

function getCourseRatingSummary(
  courseId: string | number,
  summaries: Awaited<
    ReturnType<typeof reviewService.fetchCourseRatingsSummary>
  >,
) {
  const matching = summaries.filter(
    (item) => Number(item.course_id) === Number(courseId),
  );

  const totalReviews = matching.length;
  const rating =
    totalReviews > 0
      ? matching.reduce((sum, item) => sum + item.rating, 0) / totalReviews
      : 0;

  return { rating, total_reviews: totalReviews };
}

export async function fetchCategories(): Promise<string[]> {
  try {
    const list = await categoryService.getCategories();
    if (list && list.length > 0) {
      const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
      return ["All", ...sorted.map((c) => c.name)];
    }
  } catch (err) {
    console.warn("[explore-data] Failed to fetch categories from backend, using fallback:", err);
  }
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
    const all = await courseService.getCourses();
    const ratingSummaries =
    await reviewService.fetchCourseRatingsSummary();
    let courses = all.filter((c) => c.is_published !== false);

    if (filters.category !== "All") {
      courses = courses.filter((c) => c.category?.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)),
      );
    }

    
switch (filters.sort) {
  case "newest":
    courses.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    break;

  case "price-asc":
    courses.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    break;

  case "rating":
    courses.sort(
      (a, b) =>
        getCourseRatingSummary(b.id, ratingSummaries).rating -
        getCourseRatingSummary(a.id, ratingSummaries).rating,
    );
    break;

  case "popular":
  default:
    courses.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
}


    return courses.slice(0, 48).map((c) => ({
      id: String(c.id),
      title: c.title,
      category: c.category,
      level: c.level,
      price: c.price,
      original_price: null,
      gst_rate: c.gst_rate ?? 18,
      is_free: c.is_free,
      thumbnail_url: c.thumbnail_url,
      ...getCourseRatingSummary(c.id, ratingSummaries),
      instructor_name: null,
    }));
  } catch (err: any) {
    console.error("[fetchExploreCourses] Caught error:", err);
    // DO NOT silently return fake fallback courses when backend fails
    return [];
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

  // Preserve explicit demo course request only
  if (id.startsWith("demo-")) {
    return DEMO_DETAIL(id);
  }

  try {
    const c = await courseService.getCourseById(id);
    if (!c) {
      console.error("[fetchCourseDetail] Course not found:", id);
      throw new Error(`Course not found: ${id}`);
    }

    const ratingSummaries =
      await reviewService.fetchCourseRatingsSummary();

    const ratingSummary = getCourseRatingSummary(
      c.id,
      ratingSummaries,
    );

    const result: CourseDetail = {
      id: String(c.id),
      title: c.title,
      category: c.category,
      level: c.level,
      price: c.price ?? 0,
      original_price: null,
      gst_rate: c.gst_rate ?? 18,
      is_free: c.is_free ?? false,
      thumbnail_url: c.thumbnail_url,
      ...ratingSummary,
      instructor_name: null,
      description: c.description ?? "No description available.",
      enrolled_count: 0,
      duration_hours: null,
      what_you_will_learn: [
        "Hands-on project-based learning",
        "Industry-relevant skills",
        "Certificate of completion",
        "Lifetime access to course materials",
      ],
      instructor_id: c.instructor_id,
      instructor_bio: null,
      instructor_avatar: null,
    };

    return result;
  } catch (err) {
    console.error("[fetchCourseDetail] Caught exception:", err);
    throw err;
  }
}

export async function fetchCourseModules(courseId: string): Promise<Module[]> {
  console.log("[fetchCourseModules] Fetching modules for course:", courseId);

  // Preserve explicit demo course request only
  if (courseId.startsWith("demo-")) {
    console.log("[fetchCourseModules] Resolving from DEMO_MODULES for course:", courseId);
    return DEMO_MODULES;
  }

  try {
    const targetCourseId = await resolveCourseId(courseId);
    const curriculum = await courseService.getCourseCurriculum(targetCourseId);

    return curriculum.map((m) => ({
      id: String(m.id),
      title: m.title,
      position: m.position,
      lessons: m.lessons.map((l) => ({
        id: String(l.id),
        title: l.title,
        duration_minutes: l.duration_minutes,
        position: l.position,
      })),
    }));
  } catch (err) {
    console.error("[fetchCourseModules] Caught exception:", err);
    return [];
  }
}

export async function fetchCourseReviews(courseId: string): Promise<Review[]> {
  const reviews = await reviewService.fetchCourseReviews(courseId);
  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    user_name: r.user_name,
    user_avatar: r.user_avatar,
  }));
}

export async function fetchMyCourseReview(
  _userId: string,
  courseId: string,
): Promise<{ id: string; rating: number; comment: string | null; status: "pending" | "approved" | "rejected" } | null> {
  return reviewService.fetchMyCourseReview(courseId);
}

export async function submitCourseReview(
  _userId: string,
  courseId: string,
  rating: number,
  comment: string,
): Promise<{ ok: boolean; error?: string }> {
  return reviewService.submitCourseReview(courseId, rating, comment);
}

export async function resolveCourseId(courseId: string | number): Promise<string | number> {
  const str = String(courseId).trim();
  if (typeof courseId === "number" || /^\d+$/.test(str) || str.startsWith("demo-")) {
    return /^\d+$/.test(str) ? str : courseId;
  }
  try {
    const resolved = await courseService.resolveCourseId(str);
    return resolved;
  } catch {}
  return courseId;
}

export async function enrollInCourse(
  userId: string,
  courseId: string | number,
  isFree: boolean = false,
): Promise<{ ok: boolean; error?: string }> {
  console.log("[enrollInCourse] Starting enrollment via enrollmentService:", { userId, courseId, isFree });
  const res = await enrollmentService.enrollInCourse(courseId, isFree, userId);
  return { ok: res.ok, error: res.error };
}

export async function isEnrolled(userId: string, courseId: string | number): Promise<boolean> {
  return enrollmentService.isEnrolled(courseId, userId);
}
