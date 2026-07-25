import { supabase } from "@/integrations/supabase/client";

export type Certificate = {
  id: string;
  user_id: string;
  course_id: number;
  certificate_number: string;
  issued_at: string;
  created_at: string;
  courses?: {
    id: number;
    title: string;
    category: string | null;
    thumbnail_url: string | null;
  } | null;
};

/**
 * Generates a unique certificate number (e.g. MF-CERT-2026-A8F92)
 */
function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const randomHex = Math.random().toString(16).substring(2, 7).toUpperCase();
  return `MF-CERT-${year}-${randomHex}`;
}

/**
 * Fetches an existing certificate for a user + course, or creates one if the course is completed.
 */
export async function getOrCreateCertificate(
  userId: string,
  courseId: string | number,
): Promise<Certificate | null> {
  const numericCourseId = Number(courseId);
  if (!userId || isNaN(numericCourseId)) return null;

  try {
    // 1. Check if certificate already exists
    const { data: existing, error: fetchErr } = await supabase
      .from("certificates")
      .select(
        "id, user_id, course_id, certificate_number, issued_at, created_at, courses(id, title, category, thumbnail_url)",
      )
      .eq("user_id", userId)
      .eq("course_id", numericCourseId)
      .maybeSingle();

    if (existing && !fetchErr) {
      return existing as unknown as Certificate;
    }

    // 2. If not found, attempt to insert new certificate row
    const newCertNumber = generateCertificateNumber();
    const { data: inserted, error: insertErr } = await supabase
      .from("certificates")
      .insert({
        user_id: userId,
        course_id: numericCourseId,
        certificate_number: newCertNumber,
        issued_at: new Date().toISOString(),
      })
      .select(
        "id, user_id, course_id, certificate_number, issued_at, created_at, courses(id, title, category, thumbnail_url)",
      )
      .single();

    if (insertErr || !inserted) {
      console.warn("Could not create certificate row:", insertErr);
      return null;
    }

    return inserted as unknown as Certificate;
  } catch (err) {
    console.error("Failed to get or create certificate:", err);
    return null;
  }
}

/**
 * Fetches a specific certificate by its UUID (`certificates.id`).
 */
export async function fetchCertificateById(certificateId: string): Promise<Certificate | null> {
  if (!certificateId) return null;

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select(
        "id, user_id, course_id, certificate_number, issued_at, created_at, courses(id, title, category, thumbnail_url)",
      )
      .eq("id", certificateId)
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as Certificate;
  } catch (err) {
    console.error("Failed to fetch certificate by ID:", err);
    return null;
  }
}
