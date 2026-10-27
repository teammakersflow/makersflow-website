import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { CourseTabs, type TabKey } from "@/components/course/CourseTabs";
import { PriceCard } from "@/components/course/PriceCard";
import { CourseKitCard } from "@/components/course/CourseKitCard";
import {
  StickyEnrollBar,
  CourseHero,
  OverviewTab,
  CurriculumTab,
  ReviewsTab,
  InstructorTab,
} from "@/components/course/CourseDetailComponents";
import { useAuth } from "@/integrations/supabase/auth";
import {
  fetchCourseDetail,
  fetchCourseModules,
  fetchCourseReviews,
  enrollInCourse,
  isEnrolled,
} from "@/lib/explore-data";
import {
  isCourseFavorite,
  toggleCourseFavorite,
  isWatchLater as checkWatchLater,
  toggleWatchLater,
} from "@/lib/saved-items-data";
import { shareItem } from "@/lib/share-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/course/$id")({
  head: () => ({
    meta: [
      { title: "Course — MakersFlow" },
      {
        name: "description",
        content: "Course details, curriculum, reviews and instructor on MakersFlow.",
      },
      { property: "og:title", content: "Course — MakersFlow" },
    ],
  }),
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("overview");
  const [showSticky, setShowSticky] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledLocal, setEnrolledLocal] = useState(false);

  const courseQ = useQuery({ queryKey: ["course", id], queryFn: () => fetchCourseDetail(id) });
  const modulesQ = useQuery({
    queryKey: ["course", id, "modules"],
    queryFn: () => fetchCourseModules(id),
  });
  const reviewsQ = useQuery({
    queryKey: ["course", id, "reviews"],
    queryFn: () => fetchCourseReviews(id),
  });
  const enrolledQ = useQuery({
    queryKey: ["course", id, "enrolled", user?.id],
    queryFn: () => isEnrolled(user!.id, id),
    enabled: !!user?.id,
  });

  const favQ = useQuery({
    queryKey: ["course", id, "favorite", user?.id],
    queryFn: () => isCourseFavorite(user!.id, id),
    enabled: !!user?.id,
  });

  const watchLaterQ = useQuery({
    queryKey: ["course", id, "watchLater", user?.id],
    queryFn: () => checkWatchLater(user!.id, id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const course = courseQ.data;
  const enrolled = enrolledLocal || !!enrolledQ.data;

  const handleEnroll = async () => {
    if (!course) return;

    // Not logged in: redirect to login
    if (!user) {
      navigate({ to: "/login", search: { redirect: `/course/${course.id}` } });
      return;
    }

    // Already enrolled: go to my learning
    if (enrolled) {
      navigate({ to: "/my-learning" });
      return;
    }

    // Free course: enroll directly
    if (course.is_free || course.price === 0) {
      setEnrolling(true);

      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<{ ok: boolean; error?: string }>((_, reject) => {
          setTimeout(() => reject(new Error("Enrollment timeout")), 5000);
        });

        // Race between enrollment and timeout
        const res = await Promise.race([
          enrollInCourse(user.id, course.id, true), // Pass true for isFree
          timeoutPromise,
        ]);

        setEnrolling(false);

        if (res.ok) {
          qc.invalidateQueries({ queryKey: ["is-enrolled", user.id, course.id] });
          qc.invalidateQueries({ queryKey: ["my-learning", user.id] });
          qc.invalidateQueries({ queryKey: ["dashboard", "stats", user.id] });
          qc.invalidateQueries({ queryKey: ["dashboard", "continue", user.id] });

          setEnrolledLocal(true);
          toast.success("Enrolled successfully! 🎉");
          // Small delay to show the success state before redirecting
          setTimeout(() => {
            navigate({ to: "/my-learning" });
          }, 500);
        } else {
          toast.error(res.error ?? "Could not enroll");
        }
      } catch (error: any) {
        setEnrolling(false);
        toast.error(error?.message ?? "Enrollment failed. Please try again.");
        console.error("Enrollment error:", error);
      }
      return;
    }

    // Paid course: go to checkout
    navigate({ to: "/checkout", search: { course: course.id } });
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please sign in to favorite courses");
      return;
    }
    const res = await toggleCourseFavorite(user.id, id);
    if (res.error) toast.error(res.error);
    else {
      toast.success(res.favorite ? "Added to Favorites ❤️" : "Removed from Favorites");
      qc.invalidateQueries({ queryKey: ["course", id, "favorite", user.id] });
    }
  };

  const handleToggleWatchLater = async () => {
    if (!user) {
      toast.error("Please sign in to save courses");
      return;
    }
    const res = await toggleWatchLater(user.id, id);
    if (res.error) toast.error(res.error);
    else {
      toast.success(res.saved ? "Saved for Watch Later ⏱️" : "Removed from Watch Later");
      qc.invalidateQueries({ queryKey: ["course", id, "watchLater", user.id] });
    }
  };

  const handleShare = () => {
    if (!course) return;
    shareItem({
      title: `${course.title} — MakersFlow`,
      text: course.description || `Check out ${course.title} on MakersFlow!`,
      url: window.location.href,
    });
  };

  if (courseQ.isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        {user && <AppSidebar />}
        <div className="grid flex-1 place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      </div>
    );
  }

  if (courseQ.isError || !course) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        {user && <AppSidebar />}
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-bold mb-2 text-foreground">Course Not Found</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            The course you are looking for does not exist, was unpublished, or could not be loaded.
          </p>
          <button
            onClick={() => navigate({ to: "/explore" })}
            className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {user && <AppSidebar />}
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <StickyEnrollBar
          course={course}
          enrolled={enrolled}
          enrolling={enrolling}
          onEnroll={handleEnroll}
          show={showSticky}
        />
        <CourseHero
          course={course}
          onBack={() => navigate({ to: "/explore" })}
          onSelectReviewsTab={() => setTab("reviews")}
        />

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <CourseTabs active={tab} onChange={setTab} />
              <div className="mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {tab === "overview" && (
                      <OverviewTab
                        course={course}
                        onSelectReviewsTab={() => setTab("reviews")}
                      />
                    )}
                    {tab === "curriculum" && (
                      <CurriculumTab modules={modulesQ.data ?? []} isLoading={modulesQ.isLoading} />
                    )}
                    {tab === "reviews" && (
                      <ReviewsTab
                        courseId={course.id}
                        userId={user?.id}
                        enrolled={enrolled}
                        reviews={reviewsQ.isLoading ? [] : (reviewsQ.data ?? [])}
                        onRefetch={() => reviewsQ.refetch()}
                      />
                    )}
                    {tab === "instructor" && <InstructorTab course={course} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <aside className="lg:sticky lg:top-4 lg:self-start">
              <PriceCard
                course={course}
                enrolled={enrolled}
                enrolling={enrolling}
                onEnroll={handleEnroll}
                isFavorite={!!favQ.data}
                onToggleFavorite={handleToggleFavorite}
                isWatchLater={!!watchLaterQ.data}
                onToggleWatchLater={handleToggleWatchLater}
                onShare={handleShare}
              />
              <CourseKitCard courseId={id} />
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
