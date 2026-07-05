import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { CourseTabs, type TabKey } from "@/components/course/CourseTabs";
import { PriceCard } from "@/components/course/PriceCard";
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

  if (courseQ.isLoading || !course) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="grid flex-1 place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <StickyEnrollBar
          course={course}
          enrolled={enrolled}
          enrolling={enrolling}
          onEnroll={handleEnroll}
          show={showSticky}
        />
        <CourseHero course={course} onBack={() => navigate({ to: "/explore" })} />

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
                    {tab === "overview" && <OverviewTab course={course} />}
                    {tab === "curriculum" && (
                      <CurriculumTab modules={modulesQ.data ?? []} isLoading={modulesQ.isLoading} />
                    )}
                    {tab === "reviews" && (
                      <ReviewsTab reviews={reviewsQ.isLoading ? [] : (reviewsQ.data ?? [])} />
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
              />
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
