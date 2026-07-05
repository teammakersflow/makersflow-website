/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

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

// Fallback questions for various topics
const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: "fb-q1",
    lesson_id: "fallback",
    question_text: "Which component is used to limit the flow of electric current in a circuit?",
    options: ["Capacitor", "Resistor", "Transistor", "Diode"],
    position: 1,
    isFallback: true,
    correctOptionIndex: 1, // Resistor
  },
  {
    id: "fb-q2",
    lesson_id: "fallback",
    question_text: "What does CPU stand for in computer science?",
    options: [
      "Central Processing Unit",
      "Computer Personal Unit",
      "Central Processor Unifier",
      "Control Process Utility",
    ],
    position: 2,
    isFallback: true,
    correctOptionIndex: 0, // Central Processing Unit
  },
  {
    id: "fb-q3",
    lesson_id: "fallback",
    question_text: "In robotics, what is the main purpose of an actuator?",
    options: [
      "To sense the environment",
      "To process code",
      "To convert energy into motion",
      "To store battery charge",
    ],
    position: 3,
    isFallback: true,
    correctOptionIndex: 2, // To convert energy into motion
  },
  {
    id: "fb-q4",
    lesson_id: "fallback",
    question_text: "Which sensor is commonly used to measure distance by sending sound waves?",
    options: [
      "Infrared Sensor",
      "Ultrasonic Sensor",
      "LDR (Light Dependent Resistor)",
      "Gyroscope",
    ],
    position: 4,
    isFallback: true,
    correctOptionIndex: 1, // Ultrasonic Sensor
  },
  {
    id: "fb-q5",
    lesson_id: "fallback",
    question_text: "What is the binary representation of the decimal number 5?",
    options: ["100", "101", "110", "111"],
    position: 5,
    isFallback: true,
    correctOptionIndex: 1, // 101
  },
];

/**
 * Fetches all questions for a given lesson.
 * Falls back to local sample questions if the fetch fails or returns no rows.
 */
export async function fetchQuizQuestions(lessonId: string): Promise<QuizQuestion[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("quiz_questions_public")
      .select("id, lesson_id, question_text, options, position")
      .eq("lesson_id", lessonId)
      .order("position", { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map((q: any) => ({
        id: q.id,
        lesson_id: q.lesson_id,
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || "[]"),
        position: q.position,
      }));
    }
  } catch (err) {
    console.warn(`[makersflow] fetchQuizQuestions failed, using fallback:`, err);
  }

  // Return fallback questions if no db questions exist
  return FALLBACK_QUESTIONS.map((q) => ({
    ...q,
    lesson_id: lessonId,
  }));
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

  // Client-side fallback if RPC fails or it's a fallback question
  const fallback = FALLBACK_QUESTIONS.find((q) => q.id === questionId);
  if (fallback) {
    return {
      isCorrect: selectedIndex === fallback.correctOptionIndex,
      correctOptionIndex: fallback.correctOptionIndex ?? 0,
    };
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

    // Check answer: checks local correct index for fallback, calls RPC for DB questions
    if (q.isFallback) {
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) score++;
      results[q.id] = {
        isCorrect,
        correctOptionIndex: q.correctOptionIndex ?? 0,
      };
    } else {
      const res = await checkQuizAnswer(q.id, selected);
      if (res.isCorrect) score++;
      results[q.id] = res;
    }
  }

  // Attempt to save to database if not in fallback mode (fallback IDs start with fb-)
  const isAnyFallback = questions.some((q) => q.isFallback);
  if (!isAnyFallback && userId) {
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
