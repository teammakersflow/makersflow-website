import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import {
  fetchQuizQuestions,
  submitQuizAttempt,
  type QuizQuestion,
  type QuizAttemptResult,
} from "@/lib/quiz-data";
import { cn } from "@/lib/utils";

interface QuizProps {
  lessonId: string;
  userId?: string;
  onStateChange?: (inProgress: boolean) => void;
}

export function Quiz({ lessonId, userId, onStateChange }: QuizProps) {
  const {
    data: questions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["quiz_questions", lessonId],
    queryFn: () => fetchQuizQuestions(lessonId),
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);

  // Trigger onStateChange to alert parent when quiz is in progress
  useEffect(() => {
    const answeredCount = Object.keys(answers).length;
    const inProgress = answeredCount > 0 && result === null;
    onStateChange?.(inProgress);
  }, [answers, result, onStateChange]);

  const handleSelect = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNext = () => {
    if (questions && currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!questions) return;

    // Validate all answered
    const unanswered = questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const attempt = await submitQuizAttempt(lessonId, userId ?? "", answers);
      setResult(attempt);
      toast.success("Quiz submitted successfully!");
    } catch (err) {
      toast.error("Failed to submit quiz. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    refetch();
  };

  if (isLoading) {
    return (
      <Card className="border border-border/80 bg-card p-12 text-center rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Loading quiz questions...</p>
      </Card>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <Card className="border border-border/85 bg-card p-8 text-center rounded-2xl">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive mb-3">
          <XCircle className="h-6 w-6" />
        </div>
        <CardTitle className="font-display text-lg font-bold">No questions found</CardTitle>
        <CardDescription className="mt-1 text-sm text-muted-foreground">
          We couldn't load the questions for this lesson. Please check back later.
        </CardDescription>
        <Button onClick={handleRetry} className="mt-4" variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </Card>
    );
  }

  // Quiz Results State
  if (result) {
    const pct = Math.round((result.score / result.total_questions) * 100);
    let feedback = "Keep learning and try again!";
    if (pct === 100) feedback = "Perfect score! Outstanding work!";
    else if (pct >= 80) feedback = "Excellent! You have a great grasp of this topic.";
    else if (pct >= 60) feedback = "Good effort! Review the notes and try to get a higher score.";

    return (
      <div className="space-y-6">
        <Card className="border border-border bg-card shadow-elegant rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-accent" />
          <CardHeader className="text-center pt-8">
            <CardTitle className="font-display text-3xl font-extrabold">Quiz Results</CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              {feedback}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-8">
            {/* Score Ring / Display */}
            <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-4 border-muted mb-4 bg-muted/10">
              <div className="text-center">
                <span className="font-display text-4xl font-black text-foreground">
                  {result.score}
                </span>
                <span className="text-muted-foreground text-sm block border-t border-border mt-1 pt-0.5 px-2">
                  out of {result.total_questions}
                </span>
              </div>
            </div>
            <div className="text-sm font-semibold px-4 py-1.5 bg-primary/10 text-primary rounded-full font-numeric">
              {pct}% Correct
            </div>
          </CardContent>
          <CardFooter className="bg-secondary/40 border-t border-border/80 flex justify-center py-4">
            <Button
              onClick={handleRetry}
              className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground font-semibold px-6 shadow-sm hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Retry Quiz
            </Button>
          </CardFooter>
        </Card>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-foreground pl-1">Review Answers</h3>
          {questions.map((q) => {
            const userAnswer = answers[q.id];
            const resultData = result.results[q.id];
            const isCorrect = resultData?.isCorrect ?? false;
            const correctIndex = resultData?.correctOptionIndex ?? 0;

            return (
              <Card
                key={q.id}
                className="border border-border/80 bg-card rounded-2xl overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase bg-secondary/80 px-2.5 py-0.5 rounded-full font-numeric">
                        Question {q.position}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive bg-destructive/10 px-2.5 py-0.5 rounded-full">
                          <XCircle className="h-3.5 w-3.5" /> Incorrect
                        </span>
                      )}
                    </div>
                  </div>
                  <CardTitle className="font-display text-base font-bold mt-2">
                    {q.question_text}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {q.options.map((opt, oIdx) => {
                    const isUserSelected = userAnswer === oIdx;
                    const isCorrectOption = correctIndex === oIdx;

                    return (
                      <div
                        key={oIdx}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border text-sm transition-colors",
                          isCorrectOption
                            ? "bg-success/5 border-success text-success-foreground font-semibold"
                            : isUserSelected
                              ? "bg-destructive/5 border-destructive text-destructive-foreground font-semibold"
                              : "bg-background border-border text-foreground/80",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold border shrink-0",
                              isCorrectOption
                                ? "bg-success text-success-foreground border-success"
                                : isUserSelected
                                  ? "bg-destructive text-destructive-foreground border-destructive"
                                  : "bg-secondary text-muted-foreground border-border",
                            )}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isCorrectOption && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {isUserSelected && !isCorrectOption && (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Quiz Answering State
  const currentQuestion = questions[currentIndex];
  const selectedOption = answers[currentQuestion.id];
  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <Card className="border border-border/80 bg-card shadow-elegant rounded-2xl relative overflow-hidden">
      {/* Top progress line indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <CardHeader className="pt-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase bg-secondary/80 px-2.5 py-0.5 rounded-full font-numeric">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-semibold text-primary inline-flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> Quiz
          </span>
        </div>
        <CardTitle className="font-display text-xl font-bold mt-3 leading-snug">
          {currentQuestion.question_text}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {currentQuestion.options.map((option, oIdx) => {
          const isSelected = selectedOption === oIdx;
          return (
            <button
              key={oIdx}
              onClick={() => handleSelect(currentQuestion.id, oIdx)}
              className={cn(
                "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left text-sm transition-all duration-200 hover:-translate-y-[1px] cursor-pointer",
                isSelected
                  ? "bg-primary/5 border-primary text-foreground shadow-[var(--shadow-glow-primary)] font-semibold"
                  : "bg-background border-border text-foreground/80 hover:bg-secondary/40 hover:border-muted-foreground/30",
              )}
            >
              <span
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-full text-xs font-bold border transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border",
                )}
              >
                {letters[oIdx] ?? oIdx}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </CardContent>

      <CardFooter className="border-t border-border/80 flex items-center justify-between py-4 mt-4 bg-secondary/15">
        <Button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          variant="outline"
          className="border-border hover:bg-secondary disabled:opacity-40 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Previous
        </Button>

        {currentIndex === questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedOption === undefined || isSubmitting}
            className="bg-gradient-to-r from-accent to-accent-light text-accent-foreground font-semibold px-6 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 cursor-pointer"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={selectedOption === undefined}
            className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground font-semibold px-6 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 cursor-pointer"
          >
            Next <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
