/**
 * get-signed-video-url — Supabase Edge Function
 * Server-side gating & signed URL generation for lesson videos.
 *
 * Verifies that the requesting user is enrolled in (or purchased) the course
 * before returning a streamable video URL.
 */

// @ts-ignore — Deno URL imports are resolved at runtime by the edge runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: CORS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const lessonId = body.lessonId ?? body.lesson_id ?? null;
    let userId = body.userId ?? body.user_id ?? null;

    if (!lessonId) return json({ error: "lessonId is required", access_granted: false }, 400);

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[get-signed-video-url] Missing Supabase env vars");
      return json({ error: "Server configuration error", access_granted: false }, 500);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract user ID from Auth bearer token if present
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token && token !== Deno.env.get("SUPABASE_ANON_KEY")) {
        const { data: userData } = await admin.auth.getUser(token);
        if (userData?.user?.id) {
          userId = userData.user.id;
        }
      }
    }

    // 1. Fetch lesson details
    const { data: lesson, error: lessonErr } = await admin
      .from("lessons")
      .select("id, module_id, video_url")
      .eq("id", lessonId)
      .maybeSingle();

    if (lessonErr || !lesson) {
      return json({ error: "Lesson not found", access_granted: false }, 404);
    }

    if (!lesson.video_url) {
      return json({ error: "No video available for this lesson", access_granted: false }, 404);
    }

    // 2. Fetch module to get course_id
    const { data: moduleData } = await admin
      .from("modules")
      .select("course_id")
      .eq("id", lesson.module_id)
      .maybeSingle();

    if (!moduleData?.course_id) {
      return json({ error: "Course relationship not found", access_granted: false }, 404);
    }

    const courseId = moduleData.course_id;

    // 3. Fetch course to check if free
    const { data: course } = await admin
      .from("courses")
      .select("is_free, price")
      .eq("id", courseId)
      .maybeSingle();

    let accessGranted = false;

    if (course && (course.is_free || course.price === 0)) {
      accessGranted = true;
    } else if (userId) {
      // Check enrollments table
      const { data: enr } = await admin
        .from("enrollments")
        .select("id, expires_at")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (enr) {
        const notExpired = !enr.expires_at || new Date(enr.expires_at) > new Date();
        if (notExpired) accessGranted = true;
      }

      if (!accessGranted) {
        // Check course_purchases table
        const { data: pur } = await admin
          .from("course_purchases")
          .select("id")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .eq("status", "active")
          .maybeSingle();

        if (pur) accessGranted = true;
      }
    }

    if (!accessGranted) {
      return json(
        {
          error: "Access denied. Enrollment or purchase required to stream this lesson.",
          access_granted: false,
        },
        403,
      );
    }

    // 4. Return video URL (during S3 transition period while bucket remains public,
    // lesson.video_url is returned directly as signed_url with an expiry metadata)
    return json({
      signed_url: lesson.video_url,
      video_url: lesson.video_url,
      access_granted: true,
      expires_in: 900,
    });
  } catch (err: any) {
    console.error("[get-signed-video-url] Exception:", err);
    return json({ error: err?.message ?? "Server error", access_granted: false }, 500);
  }
});
