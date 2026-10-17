
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/lib/auth/apiClient";

export interface QuizQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  options: string[];
  position: number;
  isFallback?: boolean;
  correctOptionIndex?: number;
}

export interface QuizAttemptResult {
  score: number;
  total_questions: number;
  results: Record<
    string,
    { isCorrect: boolean; correctOptionIndex: number }
  >;
}

/**
 * Fetches quiz questions from the NestJS backend.
 */
export async function fetchQuizQuestions(
  lessonId: string,
): Promise<QuizQuestion[]> {
  if (!lessonId || isNaN(Number(lessonId))) {
    return [];
  }

  try {
    const res = await apiClient.get<any[]>(
      `/quiz-questions/lesson/${lessonId}`,
    );

    const items = res.data ?? (Array.isArray(res) ? res : []);

    if (Array.isArray(items)) {
      return items.map((q: any) => ({
        id: q.id,
        lesson_id: String(q.lesson_id),
        question_text: q.question_text,
        options: Array.isArray(q.options)
          ? q.options
          : JSON.parse(q.options || "[]"),
        position: q.position,
      }));
    }
  } catch (err: any) {
    if (err?.status === 403 || err?.statusCode === 403) {
      return [];
    }

    console.warn(
      "[makersflow] fetchQuizQuestions NestJS error:",
      err?.message || err,
    );
  }

  return [];
}

/**
 * Submits answers to NestJS for server-side grading and saving.
 */
export async function submitQuizAttempt(
  lessonId: string,
  _userId: string,
  answers: Record<string, number>,
): Promise<QuizAttemptResult> {
  if (!lessonId || isNaN(Number(lessonId))) {
    throw new Error("Invalid lesson ID");
  }

  const response = await apiClient.post<QuizAttemptResult>(
    "/quiz-attempts/submit",
    {
      lesson_id: lessonId,
      answers,
    },
  );

  const result = response.data;

  if (
    !result ||
    typeof result.score !== "number" ||
    typeof result.total_questions !== "number" ||
    !result.results
  ) {
    throw new Error("Invalid quiz submission response");
  }

  return result;
}
