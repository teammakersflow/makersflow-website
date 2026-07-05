import { supabase } from "@/integrations/supabase/client";

export type CourseCard = {
  id: string;
  title: string;
  category: string | null;
  level: string | null;
  price: number | null;
  original_price: number | null;
  gst_rate: number;
  is_free: boolean | null;
  thumbnail_url: string | null;
  rating: number | null;
  total_reviews: number | null;
  instructor_name?: string | null;
};

export type InstructorCard = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  course_count: number;
};

const FALLBACK_COURSES: CourseCard[] = [
  {
    id: "f-1",
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
    id: "f-2",
    title: "AI for Curious Minds — Python & ML",
    category: "AI & ML",
    level: "Intermediate",
    price: 1999,
    original_price: 3499,
    is_free: false,
    thumbnail_url: "/course-thumbnails/aiml003-1024x640.jpg",
    rating: 4.8,
    total_reviews: 248,
    instructor_name: "Priya Sharma",
    gst_rate: 18,
  },
  {
    id: "f-3",
    title: "IoT Smart Home Projects",
    category: "IoT",
    level: "Intermediate",
    price: 0,
    original_price: null,
    is_free: true,
    thumbnail_url: "/course-thumbnails/EC-IoT-Internet-of-Things-750.jpg",
    rating: 4.7,
    total_reviews: 186,
    instructor_name: "Rohan Kapoor",
    gst_rate: 18,
  },
  {
    id: "f-4",
    title: "Electronics 101 — Circuits to PCBs",
    category: "Electronics",
    level: "Beginner",
    price: 999,
    original_price: 1999,
    is_free: false,
    thumbnail_url: "/course-thumbnails/embedded-systems.png",
    rating: 4.8,
    total_reviews: 421,
    instructor_name: "Ananya Iyer",
    gst_rate: 18,
  },
  {
    id: "f-5",
    title: "Python from Zero to Hero",
    category: "Programming",
    level: "Beginner",
    price: 1299,
    original_price: 2499,
    is_free: false,
    thumbnail_url: "/course-thumbnails/7023609_a203.webp",
    rating: 4.9,
    total_reviews: 905,
    instructor_name: "Vikram Singh",
    gst_rate: 18,
  },
  {
    id: "f-6",
    title: "Drone Engineering Bootcamp",
    category: "Robotics",
    level: "Advanced",
    price: 2499,
    original_price: 4999,
    is_free: false,
    thumbnail_url: "/course-thumbnails/9XFcF1OnPoDv83Zqg0tI1lP144RY8wzVckh9Os7v.webp",
    rating: 4.9,
    total_reviews: 134,
    instructor_name: "Kavya Nair",
    gst_rate: 18,
  },
];

const FALLBACK_INSTRUCTORS: InstructorCard[] = [
  { id: "i-1", full_name: "Dr. Aarav Mehta", avatar_url: null, course_count: 6 },
  { id: "i-2", full_name: "Priya Sharma", avatar_url: null, course_count: 4 },
  { id: "i-3", full_name: "Rohan Kapoor", avatar_url: null, course_count: 5 },
  { id: "i-4", full_name: "Ananya Iyer", avatar_url: null, course_count: 3 },
  { id: "i-5", full_name: "Vikram Singh", avatar_url: null, course_count: 7 },
  { id: "i-6", full_name: "Kavya Nair", avatar_url: null, course_count: 2 },
];

export async function fetchFeaturedCourses(): Promise<CourseCard[]> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select(
        "id, title, category, level, price, gst_rate, original_price, is_free, thumbnail_url, rating, total_reviews, instructor:profiles!courses_instructor_id_fkey(full_name)",
      )
      .eq("is_published", true)
      .order("rating", { ascending: false })
      .limit(8);

    if (error || !data || data.length === 0) return FALLBACK_COURSES;

    return data.map((c: any) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      level: c.level,
      price: c.price,
      original_price: c.original_price,
      is_free: c.is_free,
      thumbnail_url: c.thumbnail_url,
      rating: c.rating,
      total_reviews: c.total_reviews,
      instructor_name: c.instructor?.full_name ?? null,
      gst_rate: c.gst_rate ?? 18,
    }));
  } catch {
    return FALLBACK_COURSES;
  }
}

export async function fetchTopInstructors(): Promise<InstructorCard[]> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("instructor_id, profiles!courses_instructor_id_fkey(id, full_name, avatar_url)")
      .eq("is_published", true);

    if (error || !data || data.length === 0) return FALLBACK_INSTRUCTORS;

    const map = new Map<string, InstructorCard>();
    for (const row of data as any[]) {
      const p = row.profiles;
      if (!p?.id) continue;
      const existing = map.get(p.id);
      if (existing) existing.course_count += 1;
      else
        map.set(p.id, {
          id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          course_count: 1,
        });
    }
    const list = Array.from(map.values()).sort((a, b) => b.course_count - a.course_count);
    return list.length > 0 ? list.slice(0, 6) : FALLBACK_INSTRUCTORS;
  } catch {
    return FALLBACK_INSTRUCTORS;
  }
}
