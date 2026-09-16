/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/auth/apiClient";

export interface QuizQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  options: string[];
  position: number;
  // Metadata for fallbacks
  isFallback?: boolean;
  correctOptionIndex?: number; // Only present for client fallbacks, omitted for database questions
}

export interface QuizAttemptResult {
  score: number;
  total_questions: number;
  results: Record<string, { isCorrect: boolean; correctOptionIndex: number }>;
}

/**
 * Fetches all questions for a given lesson from quiz_questions_public view or NestJS backend.
 * Returns empty array if no questions are assigned to this lesson.
 */
export async function fetchQuizQuestions(lessonId: string): Promise<QuizQuestion[]> {
  if (!lessonId || isNaN(Number(lessonId))) {
    return [];
  }
  try {
    const res = await apiClient.get<any[]>(`/quiz-questions/lesson/${lessonId}`);
    const items = res.data ?? (Array.isArray(res) ? res : []);
    if (Array.isArray(items)) {
      return items.map((q: any) => ({
        id: q.id,
        lesson_id: String(q.lesson_id),
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || "[]"),
        position: q.position,
      }));
    }
  } catch (err: any) {
    if (err?.status === 403 || err?.statusCode === 403) {
      // User is not enrolled in course / non-preview lesson
      return [];
    }
    console.warn(`[makersflow] fetchQuizQuestions NestJS error:`, err?.message || err);
  }

  return [];
}

/**
 * Validates a single answer server-side using the check_quiz_answer RPC.
 */
export async function checkQuizAnswer(
  questionId: string,
  selectedIndex: number,
): Promise<{ isCorrect: boolean; correctOptionIndex: number }> {
  try {
    const { data, error } = await (supabase as any).rpc("check_quiz_answer", {
      p_question_id: questionId,
      p_selected_index: selectedIndex,
    });

    if (error) throw error;

    if (data && data.length > 0) {
      const result = data[0];
      return {
        isCorrect: !!result.is_correct,
        correctOptionIndex: Number(result.correct_option_index),
      };
    }
  } catch (err) {
    console.warn(`[makersflow] checkQuizAnswer RPC failed:`, err);
  }

  return { isCorrect: false, correctOptionIndex: 0 };
}

/**
 * Submits the results of a quiz attempt, scoring it and saving to the database.
 */
export async function submitQuizAttempt(
  lessonId: string,
  userId: string,
  answers: Record<string, number>,
): Promise<QuizAttemptResult> {
  const questions = await fetchQuizQuestions(lessonId);
  const results: Record<string, { isCorrect: boolean; correctOptionIndex: number }> = {};
  let score = 0;

  for (const q of questions) {
    const selected = answers[q.id];
    if (selected === undefined) {
      results[q.id] = { isCorrect: false, correctOptionIndex: 0 };
      continue;
    }

    const res = await checkQuizAnswer(q.id, selected);
    if (res.isCorrect) score++;
    results[q.id] = res;
  }

  if (userId && questions.length > 0) {
    try {
      const { error } = await (supabase as any).from("quiz_attempts").insert({
        user_id: userId,
        lesson_id: lessonId,
        score: score,
        total_questions: questions.length,
        completed_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (err) {
      console.warn(`[makersflow] submitQuizAttempt failed to save to database:`, err);
    }
  }

  return {
    score,
    total_questions: questions.length,
    results,
  };
}
