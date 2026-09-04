/**
 * MakersFlow Course, Module, and Lesson Service
 * Canonical data layer communicating with NestJS backend via apiClient.
 */

import { apiClient, type ApiResponse } from "@/lib/auth/apiClient";

export interface BackendCourse {
  id: string;
  title: string;
  description: string | null;
  instructor_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  thumbnail_url: string | null;
  slug: string | null;
  category: string | null;
  price: number | null;
  is_free: boolean | null;
  level: string | null;
  is_published: boolean | null;
  gst_rate: number;
  images: string[];
  hsn_code: string | null;
}

export interface BackendModule {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string | null;
  description: string | null;
  duration_mins: number | null;
  order: number;
}

export interface BackendLesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
  created_at: string | null;
  duration_secs: number | null;
  notes: string[];
  is_preview: boolean | null;
  order: number;
}

export interface CurriculumLesson {
  id: string;
  title: string;
  content?: string | null;
  video_url?: string | null;
  duration_minutes: number | null;
  duration_secs?: number | null;
  position: number;
  is_preview?: boolean;
}

export interface CurriculumModule {
  id: string;
  title: string;
  position: number;
  description?: string | null;
  duration_mins?: number | null;
  lessons: CurriculumLesson[];
}

// ── In-memory Cache & Request Deduplication ──────────────────────────────────
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

let coursesCache: CacheEntry<BackendCourse[]> | null = null;
let modulesCache: CacheEntry<BackendModule[]> | null = null;
let lessonsCache: CacheEntry<BackendLesson[]> | null = null;

let pendingCoursesPromise: Promise<BackendCourse[]> | null = null;
let pendingModulesPromise: Promise<BackendModule[]> | null = null;
let pendingLessonsPromise: Promise<BackendLesson[]> | null = null;

function isCacheValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.timestamp < CACHE_TTL_MS;
}

export const courseService = {
  /**
   * Invalidate all in-memory course, module, and lesson caches.
   */
  invalidateCache() {
    coursesCache = null;
    modulesCache = null;
    lessonsCache = null;
    pendingCoursesPromise = null;
    pendingModulesPromise = null;
    pendingLessonsPromise = null;
  },

  /**
   * Fetch all courses from GET /courses (cached with request deduplication).
   * Throws on network/backend failure.
   */
  async getCourses(options?: { forceFresh?: boolean }): Promise<BackendCourse[]> {
    if (!options?.forceFresh && isCacheValid(coursesCache)) {
      return coursesCache.data;
    }

    if (pendingCoursesPromise) {
      return pendingCoursesPromise;
    }

    pendingCoursesPromise = (async () => {
      try {
        const res = await apiClient.get<BackendCourse[]>("/courses");
        const list = Array.isArray(res.data) ? res.data : [];
        const normalized = list.map((c: any) => ({
          id: String(c.id),
          title: c.title ?? "Untitled Course",
          description: c.description ?? null,
          instructor_id: c.instructor_id ? String(c.instructor_id) : null,
          created_at: c.created_at ?? null,
          updated_at: c.updated_at ?? null,
          thumbnail_url: c.thumbnail_url ?? null,
          slug: c.slug ?? null,
          category: c.category ?? null,
          price: c.price != null ? Number(c.price) : null,
          is_free: c.is_free != null ? Boolean(c.is_free) : false,
          level: c.level ?? null,
          is_published: c.is_published != null ? Boolean(c.is_published) : true,
          gst_rate: c.gst_rate != null ? Number(c.gst_rate) : 18,
          images: Array.isArray(c.images) ? c.images : [],
          hsn_code: c.hsn_code ?? "999294",
        }));

        coursesCache = { data: normalized, timestamp: Date.now() };
        return normalized;
      } finally {
        pendingCoursesPromise = null;
      }
    })();

    return pendingCoursesPromise;
  },

  /**
   * Fetch course by ID or Slug.
   * If ID is numeric string, calls GET /courses/:id.
   * If not numeric (e.g. slug), resolves against catalog.
   */
  async getCourseById(idOrSlug: string | number): Promise<BackendCourse | null> {
    const str = String(idOrSlug).trim();
    if (!str) return null;

    // Check if numeric ID
    const isNumeric = /^\d+$/.test(str);
    if (isNumeric) {
      try {
        const res = await apiClient.get<BackendCourse>(`/courses/${str}`);
        const c = res.data;
        if (!c) return null;
        return {
          id: String(c.id),
          title: c.title ?? "Untitled Course",
          description: c.description ?? null,
          instructor_id: c.instructor_id ? String(c.instructor_id) : null,
          created_at: c.created_at ?? null,
          updated_at: c.updated_at ?? null,
          thumbnail_url: c.thumbnail_url ?? null,
          slug: c.slug ?? null,
          category: c.category ?? null,
          price: c.price != null ? Number(c.price) : null,
          is_free: c.is_free != null ? Boolean(c.is_free) : false,
          level: c.level ?? null,
          is_published: c.is_published != null ? Boolean(c.is_published) : true,
          gst_rate: c.gst_rate != null ? Number(c.gst_rate) : 18,
          images: Array.isArray(c.images) ? c.images : [],
          hsn_code: c.hsn_code ?? "999294",
        };
      } catch (err) {
        // If 404 or failed, try finding in full catalog before giving up
        try {
          const all = await this.getCourses();
          return all.find((c) => String(c.id) === str || c.slug === str) ?? null;
        } catch {
          return null;
        }
      }
    }

    // Slug or string identifier: look up in courses catalog
    try {
      const all = await this.getCourses();
      return all.find((c) => c.slug === str || String(c.id) === str) ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Fetch all modules, optionally filtered by courseId.
   * Preserves backend ordering (order_index primary, order secondary).
   */
  async getModules(courseId?: string | number): Promise<BackendModule[]> {
    let list: BackendModule[];

    if (isCacheValid(modulesCache)) {
      list = modulesCache.data;
    } else if (pendingModulesPromise) {
      list = await pendingModulesPromise;
    } else {
      pendingModulesPromise = (async () => {
        try {
          const res = await apiClient.get<BackendModule[]>("/modules");
          const raw = Array.isArray(res.data) ? res.data : [];
          const normalized = raw.map((m: any) => ({
            id: String(m.id),
            course_id: String(m.course_id),
            title: m.title ?? "Untitled Module",
            order_index: m.order_index != null ? Number(m.order_index) : 1,
            created_at: m.created_at ?? null,
            description: m.description ?? null,
            duration_mins: m.duration_mins != null ? Number(m.duration_mins) : null,
            order: m.order != null ? Number(m.order) : 0,
          }));

          modulesCache = { data: normalized, timestamp: Date.now() };
          return normalized;
        } finally {
          pendingModulesPromise = null;
        }
      })();
      list = await pendingModulesPromise;
    }

    if (courseId != null && courseId !== "") {
      const cIdStr = String(courseId);
      list = list.filter((m) => String(m.course_id) === cIdStr);
    }

    // Stable sort by order_index, then order
    return [...list].sort((a, b) => {
      const diff = (a.order_index ?? 0) - (b.order_index ?? 0);
      if (diff !== 0) return diff;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  },

  /**
   * Fetch single module by ID from GET /modules/:id.
   */
  async getModuleById(id: string | number): Promise<BackendModule | null> {
    const str = String(id).trim();
    if (!str) return null;
    try {
      const res = await apiClient.get<BackendModule>(`/modules/${str}`);
      const m = res.data;
      if (!m) return null;
      return {
        id: String(m.id),
        course_id: String(m.course_id),
        title: m.title ?? "Untitled Module",
        order_index: m.order_index != null ? Number(m.order_index) : 1,
        created_at: m.created_at ?? null,
        description: m.description ?? null,
        duration_mins: m.duration_mins != null ? Number(m.duration_mins) : null,
        order: m.order != null ? Number(m.order) : 0,
      };
    } catch {
      // Fallback to cache lookup
      const all = await this.getModules();
      return all.find((m) => String(m.id) === str) ?? null;
    }
  },

  /**
   * Fetch all lessons, optionally filtered by moduleId.
   * Preserves backend ordering (order_index primary, order secondary).
   */
  async getLessons(moduleId?: string | number): Promise<BackendLesson[]> {
    let list: BackendLesson[];

    if (isCacheValid(lessonsCache)) {
      list = lessonsCache.data;
    } else if (pendingLessonsPromise) {
      list = await pendingLessonsPromise;
    } else {
      pendingLessonsPromise = (async () => {
        try {
          const res = await apiClient.get<BackendLesson[]>("/lessons");
          const raw = Array.isArray(res.data) ? res.data : [];
          const normalized = raw.map((l: any) => ({
            id: String(l.id),
            module_id: String(l.module_id),
            title: l.title ?? "Untitled Lesson",
            content: l.content ?? null,
            video_url: l.video_url ?? null,
            order_index: l.order_index != null ? Number(l.order_index) : 1,
            created_at: l.created_at ?? null,
            duration_secs: l.duration_secs != null ? Number(l.duration_secs) : null,
            notes: Array.isArray(l.notes) ? l.notes : [],
            is_preview: l.is_preview != null ? Boolean(l.is_preview) : false,
            order: l.order != null ? Number(l.order) : 0,
          }));

          lessonsCache = { data: normalized, timestamp: Date.now() };
          return normalized;
        } finally {
          pendingLessonsPromise = null;
        }
      })();
      list = await pendingLessonsPromise;
    }

    if (moduleId != null && moduleId !== "") {
      const mIdStr = String(moduleId);
      list = list.filter((l) => String(l.module_id) === mIdStr);
    }

    // Stable sort by order_index, then order
    return [...list].sort((a, b) => {
      const diff = (a.order_index ?? 0) - (b.order_index ?? 0);
      if (diff !== 0) return diff;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  },

  /**
   * Fetch single lesson by ID from GET /lessons/:id.
   */
  async getLessonById(id: string | number): Promise<BackendLesson | null> {
    const str = String(id).trim();
    if (!str) return null;
    try {
      const res = await apiClient.get<BackendLesson>(`/lessons/${str}`);
      const l = res.data;
      if (!l) return null;
      return {
        id: String(l.id),
        module_id: String(l.module_id),
        title: l.title ?? "Untitled Lesson",
        content: l.content ?? null,
        video_url: l.video_url ?? null,
        order_index: l.order_index != null ? Number(l.order_index) : 1,
        created_at: l.created_at ?? null,
        duration_secs: l.duration_secs != null ? Number(l.duration_secs) : null,
        notes: Array.isArray(l.notes) ? l.notes : [],
        is_preview: l.is_preview != null ? Boolean(l.is_preview) : false,
        order: l.order != null ? Number(l.order) : 0,
      };
    } catch {
      // Fallback to cached lookup
      const all = await this.getLessons();
      return all.find((l) => String(l.id) === str) ?? null;
    }
  },

  /**
   * Builds the complete course curriculum (nested modules with lessons).
   * Preserves module and lesson ordering.
   */
  async getCourseCurriculum(courseId: string | number): Promise<CurriculumModule[]> {
    const courseIdStr = String(courseId).trim();
    if (!courseIdStr) return [];

    const modules = await this.getModules(courseIdStr);
    if (modules.length === 0) return [];

    const moduleIds = new Set(modules.map((m) => String(m.id)));
    const allLessons = await this.getLessons();
    const relevantLessons = allLessons.filter((l) => moduleIds.has(String(l.module_id)));

    return modules.map((m) => ({
      id: String(m.id),
      title: m.title,
      position: m.order_index ?? m.order ?? 0,
      description: m.description,
      duration_mins: m.duration_mins,
      lessons: relevantLessons
        .filter((l) => String(l.module_id) === String(m.id))
        .map((l) => ({
          id: String(l.id),
          title: l.title,
          content: l.content,
          video_url: l.video_url,
          duration_minutes: l.duration_secs ? Math.round(l.duration_secs / 60) : null,
          duration_secs: l.duration_secs,
          position: l.order_index ?? l.order ?? 0,
          is_preview: l.is_preview ?? false,
        }))
        .sort((a, b) => a.position - b.position),
    }));
  },

  /**
   * Helper: Get all lesson IDs belonging to a course.
   */
  async getLessonIdsForCourse(courseId: string | number): Promise<string[]> {
    const curriculum = await this.getCourseCurriculum(courseId);
    return curriculum.flatMap((m) => m.lessons.map((l) => l.id));
  },

  /**
   * Helper: Build map of lesson ID -> duration in seconds.
   */
  async getLessonDurationsMap(lessonIds?: (string | number)[]): Promise<Map<string, number>> {
    const all = await this.getLessons();
    const map = new Map<string, number>();

    const filterSet = lessonIds ? new Set(lessonIds.map((id) => String(id))) : null;

    for (const l of all) {
      const idStr = String(l.id);
      if (!filterSet || filterSet.has(idStr)) {
        const secs = l.duration_secs ?? 0;
        map.set(idStr, secs);
      }
    }

    return map;
  },

  /**
   * Helper: Resolve slug or ID to canonical course ID string.
   */
  async resolveCourseId(idOrSlug: string | number): Promise<string> {
    const str = String(idOrSlug).trim();
    if (!str) return str;
    if (/^\d+$/.test(str) || str.startsWith("demo-")) {
      return str;
    }
    const course = await this.getCourseById(str);
    return course ? String(course.id) : str;
  },

  /**
   * Helper: Fetch multiple courses by ID for checkout/orders.
   */
  async getCoursesByIds(ids: (string | number)[]): Promise<BackendCourse[]> {
    if (!ids || ids.length === 0) return [];
    const idSet = new Set(ids.map((id) => String(id)));
    const all = await this.getCourses();
    return all.filter((c) => idSet.has(String(c.id)));
  },
};
