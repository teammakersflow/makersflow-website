import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLesson,
  fetchLessonResources,
  fetchCourseProgressMap,
  fetchEnrolledCourses,
  fetchProgressOverview,
  upsertLessonProgress,
  markLessonComplete,
  type LessonDetail,
  type LessonResource,
  type LessonProgressRow,
  type EnrolledCourse,
  type ProgressOverview,
} from "@/lib/learn-data";

export function useLesson(courseId: string, lessonId: string) {
  return useQuery<LessonDetail>({
    queryKey: ["lesson", courseId, lessonId],
    queryFn: () => fetchLesson(courseId, lessonId),
    enabled: Boolean(courseId && lessonId),
  });
}

export function useLessonResources(lessonId: string) {
  return useQuery<LessonResource[]>({
    queryKey: ["lesson-resources", lessonId],
    queryFn: () => fetchLessonResources(lessonId),
    enabled: Boolean(lessonId),
  });
}

export function useCourseProgressMap(userId: string | undefined, courseId: string) {
  return useQuery<Record<string, LessonProgressRow>>({
    queryKey: ["course-progress-map", userId, courseId],
    queryFn: () => fetchCourseProgressMap(userId!, courseId),
    enabled: Boolean(userId && courseId),
  });
}

export function useEnrolledCourses(userId: string | undefined) {
  return useQuery<EnrolledCourse[]>({
    queryKey: ["enrolled-courses", userId],
    queryFn: () => fetchEnrolledCourses(userId!),
    enabled: Boolean(userId),
  });
}

export function useProgressOverview(userId: string | undefined) {
  return useQuery<ProgressOverview>({
    queryKey: ["progress-overview", userId],
    queryFn: () => fetchProgressOverview(userId!),
    enabled: Boolean(userId),
  });
}

export function useUpsertLessonProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: {
        lesson_id: string;
        course_id: string;
        current_time_secs: number;
        watch_percentage: number;
        time_spent_secs: number;
        is_completed?: boolean;
      };
    }) => upsertLessonProgress(userId, payload),
    onSuccess: (_, { userId, payload }) => {
      queryClient.invalidateQueries({
        queryKey: ["course-progress-map", userId, payload.course_id],
      });
      queryClient.invalidateQueries({ queryKey: ["enrolled-courses", userId] });
      queryClient.invalidateQueries({ queryKey: ["progress-overview", userId] });
    },
  });
}

export function useMarkLessonComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      courseId,
      lessonId,
    }: {
      userId: string;
      courseId: string;
      lessonId: string;
    }) => markLessonComplete(userId, courseId, lessonId),
    onSuccess: (_, { userId, courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course-progress-map", userId, courseId] });
      queryClient.invalidateQueries({ queryKey: ["enrolled-courses", userId] });
      queryClient.invalidateQueries({ queryKey: ["progress-overview", userId] });
    },
  });
}
