import { courseService } from "@/lib/courseService";

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

export async function fetchFeaturedCourses(): Promise<CourseCard[]> {
  try {
    const courses = await courseService.getCourses();
    const published = courses.filter((c) => c.is_published !== false);

    // Sort by created_at descending
    published.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return published.slice(0, 8).map((c) => ({
      id: String(c.id),
      title: c.title,
      category: c.category,
      level: c.level,
      price: c.price,
      original_price: c.price ? Math.round(c.price * 1.25) : null,
      is_free: c.is_free,
      thumbnail_url: c.thumbnail_url,
      rating: 4.8,
      total_reviews: 24,
      instructor_name: null,
      gst_rate: c.gst_rate ?? 18,
    }));
  } catch (err) {
    console.error("[fetchFeaturedCourses] Backend Error:", err);
    return [];
  }
}

export async function fetchTopInstructors(): Promise<InstructorCard[]> {
  try {
    const courses = await courseService.getCourses();
    const published = courses.filter((c) => c.is_published !== false && c.instructor_id);

    const map = new Map<string, InstructorCard>();
    for (const c of published) {
      const instId = c.instructor_id;
      if (!instId) continue;
      const existing = map.get(instId);
      if (existing) {
        existing.course_count += 1;
      } else {
        map.set(instId, {
          id: instId,
          full_name: "Instructor",
          avatar_url: null,
          course_count: 1,
        });
      }
    }
    const list = Array.from(map.values()).sort((a, b) => b.course_count - a.course_count);
    return list.slice(0, 6);
  } catch (err) {
    console.error("[fetchTopInstructors] Backend Error:", err);
    return [];
  }
}
