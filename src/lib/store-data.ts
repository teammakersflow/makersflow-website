import { supabase } from "@/integrations/supabase/client";

export type Product = {
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
};

const FALLBACK: Product[] = [
  {
    id: "demo-kit-1",
    title: "Arduino Starter Robotics Kit",
    description:
      "Everything you need to build your first 3 robots — board, sensors, motors, chassis, and a printed project booklet.",
    price: 2499,
    original_price: 3999,
    category: "Kits",
    subcategory: "Robotics",
    thumbnail_url: null,
    images: null,
    rating: 4.8,
    total_reviews: 214,
    badge: "Best Seller",
    features: [
      "Arduino Uno R3 compatible board",
      "Ultrasonic + IR + temperature sensors",
      "2 DC motors + servo + motor driver",
      "Printed 80-page project booklet",
      "Free access to companion course",
    ],
    in_stock: true,
    is_course: false,
    gst_rate: 18,
    course_id: null,
  },
  {
    id: "demo-kit-2",
    title: "IoT Smart Home Lab Kit",
    description:
      "ESP32-powered kit to build smart lights, a weather station, and a voice-triggered fan. Pairs with our IoT course.",
    price: 1899,
    original_price: 2999,
    category: "Kits",
    subcategory: "IoT",
    thumbnail_url: null,
    images: null,
    rating: 4.7,
    total_reviews: 142,
    badge: "New",
    features: [
      "ESP32 dev board",
      "Relay module + LED matrix",
      "DHT22 + LDR sensors",
      "Jumper wires + breadboard",
    ],
    in_stock: true,
    is_course: false,
    gst_rate: 18,
    course_id: null,
  },
  {
    id: "demo-book-1",
    title: "Electronics 101 — Illustrated Workbook",
    description:
      "A beautifully illustrated workbook covering circuits, components, and your first 12 hands-on projects.",
    price: 499,
    original_price: 799,
    category: "Books",
    subcategory: "Electronics",
    thumbnail_url: null,
    images: null,
    rating: 4.9,
    total_reviews: 86,
    badge: null,
    features: ["140 pages, full color", "12 guided projects", "QR codes to video walkthroughs"],
    in_stock: true,
    is_course: false,
    gst_rate: 18,
    course_id: null,
  },
  {
    id: "demo-merch-1",
    title: "MakersFlow Maker Hoodie",
    description: "Soft cotton-blend hoodie with embroidered MakersFlow logo. Wear your curiosity.",
    price: 1299,
    original_price: 1799,
    category: "Merch",
    subcategory: "Apparel",
    thumbnail_url: null,
    images: null,
    rating: 4.6,
    total_reviews: 58,
    badge: null,
    features: ["320 GSM cotton blend", "Embroidered logo", "Unisex fit"],
    in_stock: false,
    is_course: false,
    gst_rate: 18,
    course_id: null,
  },
];

function normalize(row: Record<string, unknown>): Product {
  const price = Number(row.price ?? 0) || 0;
  const orig = row.original_price == null ? null : Number(row.original_price) || null;
  return {
    id: String(row.id),
    title: String(row.title ?? row.name ?? "Untitled"),
    description: (row.description as string) ?? null,
    price,
    original_price: orig,
    gst_rate: Number(row.gst_rate ?? 18),
    category: (row.category as string) ?? null,
    subcategory: (row.subcategory as string) ?? null,
    thumbnail_url:
      (row.thumbnail_url as string) ??
      (row.image_url as string) ??
      (Array.isArray(row.images) ? (row.images[0] as string) : null) ??
      null,
    images: Array.isArray(row.images) ? (row.images as string[]) : null,
    rating: row.rating == null ? null : Number(row.rating),
    total_reviews: row.total_reviews == null ? null : Number(row.total_reviews),
    badge: (row.badge as string) ?? null,
    features: Array.isArray(row.features) ? (row.features as string[]) : null,
    in_stock: row.in_stock == null ? true : Boolean(row.in_stock),
    is_course: Boolean(row.is_course),
    course_id: (row.course_id as string) ?? null,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return FALLBACK;
    const normalized = (data as Record<string, unknown>[]).map(normalize);
    // Deduplicate by ID to guarantee zero duplicates in UI
    const uniqueMap = new Map<string, Product>();
    normalized.forEach((p) => uniqueMap.set(p.id, p));
    return Array.from(uniqueMap.values());
  } catch (err) {
    console.warn(`[makersflow] fetchProducts products threw, using fallback:`, err);
    return FALLBACK;
  }
}

export async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (data) return normalize(data as Record<string, unknown>);
  } catch (err) {
    console.warn(`[makersflow] fetchProduct products threw, using fallback:`, err);
  }
  return FALLBACK.find((p) => p.id === id) ?? null;
}

export async function fetchProductReviews(productId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, user:profiles!reviews_user_id_fkey(full_name, avatar_url)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) return [];

    return (data as any[]).map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      user_name: r.user?.full_name ?? null,
      user_avatar: r.user?.avatar_url ?? null,
    }));
  } catch {
    return [];
  }
}

export async function submitProductReview(
  userId: string,
  productId: string,
  rating: number,
  comment: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!userId) return { ok: false, error: "Please sign in to submit a product review" };
  if (!rating || rating < 1 || rating > 5) return { ok: false, error: "Please select a star rating (1-5)" };

  try {
    const { error } = await supabase.from("reviews").insert({
      user_id: userId,
      product_id: productId,
      rating,
      comment: comment.trim() || null,
      status: "approved",
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "You have already submitted a review for this product." };
      }
      throw error;
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[submitProductReview] Insert failed:", err);
    return { ok: false, error: err?.message || "Could not submit review." };
  }
}

export function getProductCategories(items: Product[]): string[] {
  const set = new Set<string>();
  items.forEach((p) => p.category && set.add(p.category));
  return Array.from(set);
}

export function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
