import { createFileRoute, Link, useNavigate, useBlocker } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { VideoPlayer } from "@/components/learn/VideoPlayer";
import { Confetti } from "@/components/learn/Confetti";
import { LessonSidebar } from "@/components/learn/LessonSidebar";
import { Quiz } from "@/components/learn/Quiz";
import { LessonHeaderNav } from "@/components/learn/LessonHeaderNav";
import { LessonUpNextCard } from "@/components/learn/LessonUpNextCard";
import { LessonLockedView } from "@/components/learn/LessonLockedView";
import { supabase } from "@/integrations/supabase/client";
import { courseService } from "@/lib/courseService";
import { enrollmentService } from "@/lib/enrollmentService";
import {
  LessonTabBar,
  LessonTabPanel,
  MarkCompleteButton,
  AutoAdvanceToast,
  type TabKey,
} from "@/components/learn/LessonComponents";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  useLesson,
  useLessonResources,
  useCourseProgressMap,
  useMarkLessonComplete,
} from "@/hooks/useLearnData";
import { upsertLessonProgress } from "@/lib/learn-data";
import { fetchCourseDetail, fetchCourseModules, resolveCourseId } from "@/lib/explore-data";
import { isWatchLater, toggleWatchLater } from "@/lib/saved-items-data";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/learn/$courseId/$lessonId")({
  head: () => ({ meta: [{ title: "Lesson — MakersFlow" }] }),
  component: LessonPlayerPage,
});

function LessonPlayerPage() {
  const { courseId, lessonId } = Route.useParams();
  const { user } = useRequireAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // ── ALL state hooks must come before any conditional returns ──────────
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState<{ secondsLeft: number; targetId: string } | null>(
    null,
  );
  const advanceTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [quizInProgress, setQuizInProgress] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabKey | null>(null);

  const blocker = useBlocker({
    condition: quizInProgress,
    blockerFn: () => true,
  });

  const markCompleteMutation = useMarkLessonComplete();

  // ── Course access gate ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function checkAccess() {
      const targetCourseId = await resolveCourseId(courseId);
      // Fetch course metadata — FAIL-CLOSED: if query errors or returns null, deny access
      let course = null;
      try {
        course = await courseService.getCourseById(targetCourseId);
      } catch {
        course = null;
      }

      if (cancelled) return;

      if (!course) {
        // Fail-closed: Never default to granting access on error or missing course record
        setAccessGranted(false);
        return;
      }

      if (course.is_free || course.price === 0) {
        setAccessGranted(true);
        return;
      }

      // Check enrollment via enrollmentService OR course_purchases for paid courses
      const [enrolled, { count: purchaseCount, error: purErr }] =
        await Promise.all([
          enrollmentService.isEnrolled(targetCourseId, user!.id),
          supabase
            .from("course_purchases")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user!.id)
            .eq("course_id", targetCourseId)
            .eq("status", "active"),
        ]);

      if (cancelled) return;

      if (enrolled || (!purErr && (purchaseCount ?? 0) > 0)) {
        setAccessGranted(true);
      } else {
        setAccessGranted(false);
      }
    }
    checkAccess();
    return () => { cancelled = true; };
  }, [user, courseId]);

  useEffect(() => {
    if (!quizInProgress) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Leave quiz? Your progress on this quiz will be lost if you leave now.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [quizInProgress]);

  const handleTabChange = (nextTab: TabKey) => {
    if (quizInProgress && nextTab !== "quiz") {
      setPendingTab(nextTab);
      setShowLeaveDialog(true);
    } else {
      setTab(nextTab);
    }
  };

  const handleConfirmLeave = () => {
    if (blocker.status === "blocked") {
      blocker.proceed?.();
    }
    if (showLeaveDialog) {
      setShowLeaveDialog(false);
      if (pendingTab) {
        setTab(pendingTab);
        setPendingTab(null);
      }
    }
  };

  const handleCancelLeave = () => {
    if (blocker.status === "blocked") {
      blocker.reset?.();
    }
    setShowLeaveDialog(false);
    setPendingTab(null);
  };

  const isDialogOpen = showLeaveDialog || blocker.status === "blocked";

  // Data fetching hooks
  const lessonQ = useLesson(courseId, lessonId);
  const courseQ = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourseDetail(courseId),
  });
  const modulesQ = useQuery({
    queryKey: ["course", courseId, "modules"],
    queryFn: () => fetchCourseModules(courseId),
  });
  const progressQ = useCourseProgressMap(user?.id, courseId);
  const resourcesQ = useLessonResources(lessonId);
  const watchLaterQ = useQuery({
    queryKey: ["watch_later", user?.id, courseId],
    queryFn: () => (user?.id ? isWatchLater(user.id, courseId) : false),
    enabled: !!user?.id,
  });

  const lesson = lessonQ.data;
  const course = courseQ.data;
  const modules = useMemo(() => modulesQ.data ?? [], [modulesQ.data]);
  const progressMap = progressQ.data ?? {};
  const currentProgress = progressMap[lessonId];
  const isCompleted = !!currentProgress?.is_completed;

  const flatLessons = useMemo(
    () =>
      modules
        .slice()
        .sort((a, b) => a.position - b.position)
        .flatMap((m) =>
          m.lessons
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((l) => ({ id: l.id, title: l.title })),
        ),
    [modules],
  );
  const idx = flatLessons.findIndex((l) => l.id === lessonId);
  const nextLesson = idx >= 0 ? flatLessons[idx + 1] : undefined;
  const prevLesson = idx > 0 ? flatLessons[idx - 1] : undefined;

  useEffect(() => {
    setTab("notes");
    setSidebarOpen(false);
    setCelebrating(false);
    setQuizInProgress(false);
    if (advanceTimer.current) {
      clearInterval(advanceTimer.current);
      advanceTimer.current = null;
    }
    setAutoAdvance(null);
  }, [lessonId]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearInterval(advanceTimer.current);
    },
    [],
  );

  function cancelAutoAdvance() {
    if (advanceTimer.current) {
      clearInterval(advanceTimer.current);
      advanceTimer.current = null;
    }
    setAutoAdvance(null);
  }

  function startAutoAdvance(targetId: string) {
    setAutoAdvance({ secondsLeft: 3, targetId });
    advanceTimer.current = setInterval(() => {
      setAutoAdvance((prev) => {
        if (!prev) return prev;
        const s = prev.secondsLeft - 1;
        if (s <= 0) {
          if (advanceTimer.current) clearInterval(advanceTimer.current);
          advanceTimer.current = null;
          navigate({
            to: "/learn/$courseId/$lessonId",
            params: { courseId, lessonId: prev.targetId },
          });
          return null;
        }
        return { ...prev, secondsLeft: s };
      });
    }, 1000);
  }

  // Handle video ticks — fire-and-forget raw upsert to avoid triggering refetches/invalidations on every tick
  const handleTick = useCallback(
    (p: {
      current_time_secs: number;
      duration_secs: number;
      watch_percentage: number;
      time_spent_secs: number;
    }) => {
      if (!user || !lesson) return;
      upsertLessonProgress(user.id, {
        lesson_id: lesson.id,
        course_id: lesson.course_id,
        current_time_secs: p.current_time_secs,
        watch_percentage: p.watch_percentage,
        time_spent_secs: p.time_spent_secs,
        is_completed: isCompleted,
      });
    },
    [user, lesson, isCompleted],
  );

  const handleMarkComplete = async () => {
    if (!user || !lesson) {
      toast.error("Sign in to track progress");
      return;
    }
    setCelebrating(true);
    await markCompleteMutation.mutateAsync({
      userId: user.id,
      courseId: lesson.course_id,
      lessonId: lesson.id,
    });
    qc.setQueryData(
      ["course-progress-map", user.id, courseId],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (old: Record<string, any> | undefined) => ({
        ...(old ?? {}),
        [lesson.id]: { ...(old?.[lesson.id] ?? {}), is_completed: true, watch_percentage: 100 },
      }),
    );
    setTimeout(() => setCelebrating(false), 1800);

    const autoplayEnabled =
      typeof window !== "undefined" && localStorage.getItem("makersflow.autoplay") !== "false";
    if (nextLesson && autoplayEnabled) {
      setTimeout(() => startAutoAdvance(nextLesson.id), 2000);
    }
  };

  // ── Access gate renders ─────────────────────────────────────────────
  if (accessGranted === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (accessGranted === false) {
    return <LessonLockedView courseId={courseId} />;
  }

  if (lessonQ.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (lessonQ.isError || !lesson) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-center space-y-4 px-6">
          <h2 className="font-display text-2xl font-bold text-foreground">Lesson not found</h2>
          <p className="text-muted-foreground">This lesson could not be loaded.</p>
          <Link
            to="/course/$id"
            params={{ id: courseId }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  const handleToggleWatchLater = async () => {
    if (!user) {
      toast.error("Please sign in to bookmark courses");
      return;
    }
    const res = await toggleWatchLater(user.id, courseId);
    if (res.error) toast.error(res.error);
    else {
      toast.success(res.saved ? "Added to Watch Later!" : "Removed from Watch Later");
      watchLaterQ.refetch();
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-[340px] shrink-0 border-r border-border lg:block">
        <LessonSidebar
          courseId={courseId}
          courseTitle={course?.title ?? "Course"}
          modules={modules}
          currentLessonId={lessonId}
          progressMap={progressMap}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[320px] border-r border-border lg:hidden"
            >
              <LessonSidebar
                courseId={courseId}
                courseTitle={course?.title ?? "Course"}
                modules={modules}
                currentLessonId={lessonId}
                progressMap={progressMap}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <LessonHeaderNav
          courseId={courseId}
          lessonId={lessonId}
          courseTitle={course?.title ?? "Course"}
          lessonIndex={idx}
          totalLessons={flatLessons.length}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          isWatchLater={!!watchLaterQ.data}
          onToggleWatchLater={handleToggleWatchLater}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="mx-auto w-full max-w-5xl space-y-6 px-3 py-4 sm:px-5 sm:py-6">
          <VideoPlayer
            src={lesson.video_url ?? ""}
            poster={course?.thumbnail_url ?? undefined}
            initialTime={currentProgress?.current_time_secs ?? 0}
            onTick={handleTick}
            onEnded={() => {
              if (!isCompleted) handleMarkComplete();
            }}
            nextLesson={nextLesson}
            onNextClick={
              nextLesson
                ? () =>
                    navigate({
                      to: "/learn/$courseId/$lessonId",
                      params: { courseId, lessonId: nextLesson.id },
                    })
                : undefined
            }
          />

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-border pb-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Lesson {idx + 1} of {flatLessons.length}
                </span>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success animate-fade-in">
                    ✓ Completed
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-display text-2xl font-black text-foreground tracking-tight sm:text-3xl">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="mt-2 text-sm text-muted-foreground max-w-3xl font-normal">
                  {lesson.description}
                </p>
              )}
            </div>
            <div className="shrink-0 pt-2 md:pt-0">
              <MarkCompleteButton isCompleted={isCompleted} onClick={handleMarkComplete} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr] items-start">
            <div className="space-y-4">
              <LessonTabBar active={tab} onChange={handleTabChange} />
              <div className="mt-4">
                {tab === "quiz" ? (
                  <Quiz lessonId={lessonId} userId={user?.id} onStateChange={setQuizInProgress} />
                ) : (
                  <LessonTabPanel tab={tab} lesson={lesson} resources={resourcesQ.data ?? []} />
                )}
              </div>
            </div>

            {nextLesson && (
              <LessonUpNextCard
                courseId={courseId}
                nextLesson={nextLesson}
                nextIndex={idx + 1}
                totalLessons={flatLessons.length}
              />
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>{celebrating && <Confetti />}</AnimatePresence>

      <AnimatePresence>
        {autoAdvance && (
          <AutoAdvanceToast secondsLeft={autoAdvance.secondsLeft} onCancel={cancelAutoAdvance} />
        )}
      </AnimatePresence>

      <AlertDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelLeave();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress on this quiz will be lost if you leave now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLeave}>Stay</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLeave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
