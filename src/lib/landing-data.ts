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

    if (error || !data) return [];

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
    return [];
  }
}

export async function fetchTopInstructors(): Promise<InstructorCard[]> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("instructor_id, profiles!courses_instructor_id_fkey(id, full_name, avatar_url)")
      .eq("is_published", true);

    if (error || !data) return [];

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
    return list.slice(0, 6);
  } catch {
    return [];
  }
}
