import { supabase } from "@/integrations/supabase/client";

export type Certificate = {
  id: string;
  user_id: string;
  course_id: number;
  certificate_number: string;
  issued_at: string;
  created_at: string;
  enrolled_at?: string | null;
  courses?: {
    id: number;
    title: string;
    category: string | null;
    level?: string | null;
    thumbnail_url: string | null;
    instructor?: {
      full_name: string | null;
    } | null;
  } | null;
};

/**
  * Generates a unique certificate number (e.g. MF-CERT-2026-A8F92)
  */
export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
  return `MF-CERT-${year}-${randomHex}`;
}

/**
 * Single-source-of-truth HTML generator ported from mobile certificate.tsx template
 */
export function getCertificateHtml(
  studentName: string,
  courseName: string,
  daysCompleted: string,
  displayDate: string,
  certId: string,
  flowLogoUrl: string = "/certificates/flow_logo_transparent.png",
  edodwajaLogoUrl: string = "/certificates/edodwaja_logo_transparent.png",
  badgeUrl: string = "/certificates/badge_transparent.png",
  level?: string,
  instructor?: string
): string {
  const daysText =
    daysCompleted && daysCompleted !== 'N/A' && daysCompleted !== 'undefined' && daysCompleted !== ''
      ? `${daysCompleted} days`
      : 'all required modules';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Certificate of Completion — ${studentName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Helvetica Neue', Arial, sans-serif;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
    .cert-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 12px;
    }
    .certificate {
      width: 100%;
      max-width: 960px;
      aspect-ratio: 297 / 210;
      background: linear-gradient(135deg, #e0f7fa 0%, #ffffff 45%, #e0f2fe 100%);
      padding: 4% 5%;
      position: relative;
      overflow: hidden;
      border-radius: 12px;
      border: 3px solid #00bcd4;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
    }
    .certificate::before {
      content: "";
      position: absolute;
      top: -100px;
      right: -100px;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(0, 188, 212, 0.25) 20%, transparent 20%);
      background-size: 16px 16px;
      border-radius: 50%;
      opacity: 0.7;
      pointer-events: none;
    }
    .certificate::after {
      content: "";
      position: absolute;
      left: -120px;
      bottom: -120px;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.2) 20%, transparent 20%);
      background-size: 16px 16px;
      transform: rotate(45deg);
      border-radius: 50%;
      opacity: 0.7;
      pointer-events: none;
    }
    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      z-index: 2;
    }
    .logo {
      max-height: 52px;
      width: auto;
      object-fit: contain;
    }
    .header-section {
      margin-top: 2px;
      z-index: 2;
    }
    h1 {
      font-size: clamp(24px, 4.5vw, 48px);
      font-weight: 800;
      color: #1b4b8f;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    h3 {
      font-size: clamp(12px, 2vw, 20px);
      font-weight: 700;
      color: #0284c7;
      letter-spacing: 4px;
      margin-top: 2px;
      text-transform: uppercase;
    }
    .presented {
      font-size: clamp(11px, 1.5vw, 15px);
      color: #64748b;
      margin-top: 6px;
    }
    .name {
      font-size: clamp(20px, 3.8vw, 40px);
      font-weight: 800;
      color: #0369a1;
      border-bottom: 2px solid #38bdf8;
      display: inline-block;
      min-width: 60%;
      margin: 4px auto 8px;
      padding-bottom: 4px;
    }
    .completion-text {
      font-size: clamp(11px, 1.6vw, 15px);
      color: #475569;
    }
    .course-title {
      font-size: clamp(16px, 2.8vw, 30px);
      font-weight: 800;
      color: #0f172a;
      margin: 2px 0 4px;
    }
    .level-pill {
      display: inline-block;
      font-size: clamp(8px, 1.1vw, 11px);
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #0284c7;
      background: rgba(2, 132, 199, 0.12);
      border: 1px solid rgba(2, 132, 199, 0.3);
      border-radius: 12px;
      padding: 2px 10px;
      margin: 2px 0 1px;
      text-transform: uppercase;
    }
    .tagline {
      font-size: clamp(11px, 1.6vw, 16px);
      font-weight: 700;
      color: #0284c7;
      margin-bottom: 4px;
    }
    .instructor-credit {
      font-size: clamp(9px, 1.2vw, 13px);
      font-weight: 600;
      color: #334155;
      margin-bottom: 4px;
    }
    .desc {
      width: 85%;
      margin: 0 auto;
      line-height: 1.45;
      font-size: clamp(10px, 1.3vw, 14px);
      color: #475569;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 90%;
      margin: 8px auto 0;
      z-index: 2;
    }
    .date {
      font-size: clamp(10px, 1.4vw, 14px);
      font-weight: 700;
      color: #1b4b8f;
    }
    .verify-text {
      font-size: clamp(8px, 1.1vw, 11px);
      color: #64748b;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .cert-id {
      font-size: clamp(9px, 1.2vw, 12px);
      font-family: monospace;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .bottom-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
      margin-top: 6px;
      padding-bottom: 4px;
      z-index: 2;
    }
    .sig-block {
      width: 28%;
      text-align: center;
    }
    .sig-line {
      width: 100%;
      border-top: 2px solid #334155;
      margin-bottom: 6px;
    }
    .sig-name {
      font-size: clamp(10px, 1.5vw, 15px);
      font-weight: 700;
      color: #0f172a;
    }
    .sig-title {
      font-size: clamp(9px, 1.2vw, 13px);
      color: #64748b;
    }
    .badge {
      height: clamp(50px, 9.5vw, 95px);
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 6px 12px rgba(0,0,0,0.18));
    }

    @media print {
      @page {
        size: A4 landscape;
        margin: 0;
      }
      html, body {
        background: #ffffff;
      }
      .cert-wrapper {
        width: 297mm;
        height: 210mm;
        padding: 0;
      }
      .certificate {
        width: 297mm;
        height: 210mm;
        max-width: none;
        aspect-ratio: none;
        border-radius: 0;
        border: none;
        box-shadow: none;
        padding: 28px 45px 32px;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body>
  <div class="cert-wrapper">
    <div class="certificate">
      <div class="top-row">
        <img src="${flowLogoUrl}" class="logo" alt="Flow Logo">
        <img src="${edodwajaLogoUrl}" class="logo" alt="Edodwaja Logo">
      </div>

      <div class="header-section">
        <h1>CERTIFICATE</h1>
        <h3>OF COMPLETION</h3>
      </div>

      <p class="presented">Presented to</p>
      <h2 class="name">${studentName}</h2>

      <p class="completion-text">for successfully completing <b>${daysText}</b> in the</p>
      ${level ? `<div class="level-pill">${level.toUpperCase()} LEVEL</div>` : ''}
      <h2 class="course-title">${courseName}</h2>
      <h4 class="tagline">"Learn by Doing – Future Tech Explorers"</h4>
      ${instructor ? `<p class="instructor-credit">Instructor: ${instructor}</p>` : ''}

      <p class="desc">
        demonstrating dedication, practical skill development, and hands-on mastery of core concepts through the FLOW learning initiative.
      </p>

      <div class="meta-row">
        <p class="date">Issued on ${displayDate}</p>
        <p class="verify-text">Verify at makersflow.com/verify</p>
        <p class="cert-id">${certId}</p>
      </div>

      <div class="bottom-section">
        <div class="sig-block">
          <div class="sig-line"></div>
          <h4 class="sig-name">The FLOW BUS</h4>
          <p class="sig-title">FLOW BUS</p>
        </div>
        <img src="${badgeUrl}" class="badge" alt="Gold Badge">
        <div class="sig-block">
          <div class="sig-line"></div>
          <h4 class="sig-name">Madhulash Babu</h4>
          <p class="sig-title">Founder & CEO</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
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
        "id, user_id, course_id, certificate_number, issued_at, created_at, courses(id, title, category, level, thumbnail_url, instructor_id)",
      )
      .eq("user_id", userId)
      .eq("course_id", numericCourseId)
      .maybeSingle();

    if (fetchErr) {
      console.error("[getOrCreateCertificate] Supabase fetch error:", fetchErr);
    }

    if (existing && !fetchErr) {
      const cData = existing.courses as any;
      let instructorName: string | undefined = undefined;
      if (cData?.instructor_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", cData.instructor_id)
          .maybeSingle();
        if (prof?.full_name) instructorName = prof.full_name;
      }

      return {
        id: String(existing.id),
        user_id: String(existing.user_id),
        course_id: Number(existing.course_id),
        certificate_number: String(existing.certificate_number),
        issued_at: String(existing.issued_at),
        created_at: String(existing.created_at),
        courses: cData
          ? {
              id: Number(cData.id),
              title: String(cData.title),
              category: cData.category ?? null,
              level: cData.level ?? null,
              thumbnail_url: cData.thumbnail_url ?? null,
              instructor: instructorName ? { full_name: instructorName } : null,
            }
          : undefined,
      };
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
        "id, user_id, course_id, certificate_number, issued_at, created_at, courses(id, title, category, level, thumbnail_url, instructor_id)",
      )
      .single();

    if (insertErr || !inserted) {
      console.warn("[getOrCreateCertificate] Could not create certificate row:", insertErr);
      return null;
    }

    const cData = inserted.courses as any;
    let instructorName: string | undefined = undefined;
    if (cData?.instructor_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", cData.instructor_id)
        .maybeSingle();
      if (prof?.full_name) instructorName = prof.full_name;
    }

    return {
      id: String(inserted.id),
      user_id: String(inserted.user_id),
      course_id: Number(inserted.course_id),
      certificate_number: String(inserted.certificate_number),
      issued_at: String(inserted.issued_at),
      created_at: String(inserted.created_at),
      courses: cData
        ? {
            id: Number(cData.id),
            title: String(cData.title),
            category: cData.category ?? null,
            level: cData.level ?? null,
            thumbnail_url: cData.thumbnail_url ?? null,
            instructor: instructorName ? { full_name: instructorName } : null,
          }
        : undefined,
    };
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
        "id, user_id, course_id, certificate_number, issued_at, created_at, courses(id, title, category, level, thumbnail_url, instructor_id)",
      )
      .eq("id", certificateId)
      .maybeSingle();

    if (error) {
      console.error("[fetchCertificateById] Supabase query error:", error);
      return null;
    }
    if (!data) {
      console.warn("[fetchCertificateById] No certificate record found for ID:", certificateId);
      return null;
    }

    let enrolled_at: string | null = null;
    try {
      const { data: enr } = await supabase
        .from("enrollments")
        .select("enrolled_at")
        .eq("user_id", data.user_id)
        .eq("course_id", data.course_id)
        .maybeSingle();
      if (enr?.enrolled_at) {
        enrolled_at = enr.enrolled_at;
      }
    } catch {
      // Best effort enrollment lookup
    }

    const cData = data.courses as any;
    let instructorName: string | undefined = undefined;
    if (cData?.instructor_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", cData.instructor_id)
        .maybeSingle();
      if (prof?.full_name) instructorName = prof.full_name;
    }

    return {
      id: String(data.id),
      user_id: String(data.user_id),
      course_id: Number(data.course_id),
      certificate_number: String(data.certificate_number),
      issued_at: String(data.issued_at),
      created_at: String(data.created_at),
      enrolled_at,
      courses: cData
        ? {
            id: Number(cData.id),
            title: String(cData.title),
            category: cData.category ?? null,
            level: cData.level ?? null,
            thumbnail_url: cData.thumbnail_url ?? null,
            instructor: instructorName ? { full_name: instructorName } : null,
          }
        : undefined,
    };
  } catch (err) {
    console.error("Failed to fetch certificate by ID:", err);
    return null;
  }
}
