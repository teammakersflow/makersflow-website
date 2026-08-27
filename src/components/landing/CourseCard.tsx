import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock, Heart, Layers, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BorderGlow from "@/components/BorderGlow";
import { useAuth } from "@/integrations/supabase/auth";
import { type CourseCard as SupabaseCourse } from "@/lib/landing-data";
import { enrollInCourse, isEnrolled } from "@/lib/explore-data";
import { isCourseFavorite, toggleCourseFavorite } from "@/lib/saved-items-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CourseCard({ course }: { course: SupabaseCourse }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [enrolled, setEnrolled] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      isEnrolled(userId, course.id).then(setEnrolled);
      isCourseFavorite(userId, course.id).then(setIsFav);
    } else {
      setEnrolled(false);
      setIsFav(false);
    }
  }, [course.id, userId]);

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      toast.error("Please sign in to favorite courses");
      return;
    }
    const res = await toggleCourseFavorite(userId, course.id);
    if (res.error) toast.error(res.error);
    else {
      setIsFav(res.favorite);
      toast.success(res.favorite ? "Added to Favorites!" : "Removed from Favorites");
    }
  };

  const handleEnroll = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      navigate({ to: "/login", search: { redirect: `/course/${course.id}` } });
      return;
    }

    if (enrolled) {
      navigate({ to: "/my-learning" });
      return;
    }

    if (course.is_free || course.price === 0) {
      setLoading(true);
      try {
        const result = await enrollInCourse(userId, course.id, true);
        setLoading(false);
        if (result.ok) {
          toast.success("Enrolled successfully! 🎉");
          setEnrolled(true);
          setTimeout(() => {
            navigate({ to: "/my-learning" });
          }, 500);
        } else {
          toast.error(result.error || "Failed to enroll");
        }
      } catch (error: any) {
        setLoading(false);
        toast.error(error?.message ?? "Enrollment failed. Please try again.");
      }
      return;
    }

    navigate({ to: "/checkout", search: { course: course.id } });
  };

  return (
    <article className="card-lift flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <BorderGlow
        borderRadius={16}
        glowColor="277 80 60"
        colors={["#4F46E5", "#3B82F6", "#10B981"]}
        backgroundColor="transparent"
        glowIntensity={0.6}
      >
        <div className="relative aspect-video overflow-hidden bg-secondary">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={`${course.title} course`}
              loading="lazy"
              width={900}
              height={560}
              className="size-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30 font-display text-2xl font-bold text-foreground">
              {course.category ?? "Robotics"}
            </div>
          )}
          {course.is_free || course.price === 0 ? (
            <Badge className="absolute right-3 top-3 rounded-full bg-emerald-500 text-white shadow">
              FREE
            </Badge>
          ) : course.original_price && course.price && course.price < course.original_price ? (
            <Badge className="absolute right-3 top-3 rounded-full bg-accent text-accent-foreground shadow">
              {Math.round(((course.original_price - course.price) / course.original_price) * 100)}% OFF
            </Badge>
          ) : null}
        </div>
      </BorderGlow>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-primary font-semibold">{course.category ?? "Course"}</span>
            {course.level && (
              <>
                <span>·</span>
                <span>{course.level}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleToggleFav}
            className="p-1 text-muted-foreground hover:text-rose-500 transition-colors"
            title={isFav ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart
              className={cn("size-4 transition-colors", isFav ? "fill-rose-500 text-rose-500" : "")}
            />
          </button>
        </div>

        <h3 className="mt-3 font-display text-lg font-semibold leading-snug">
          <Link to="/course/$id" params={{ id: course.id }} className="hover:text-primary transition-colors">
            {course.title}
          </Link>
        </h3>

        {course.instructor_name && (
          <p className="mt-1 text-xs text-muted-foreground">By {course.instructor_name}</p>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">{course.rating?.toFixed(1) ?? "4.8"}</span>
            {course.total_reviews ? <span>({course.total_reviews})</span> : null}
          </div>
          <div className="font-semibold text-foreground">
            {course.is_free || course.price === 0 ? (
              <span className="text-emerald-500">Free</span>
            ) : (
              <span>₹{(course.price ?? 0).toLocaleString("en-IN")}</span>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Link
            to="/course/$id"
            params={{ id: course.id }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            View Course
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <button
            onClick={handleEnroll}
            disabled={loading}
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Enrolling..." : enrolled ? "Continue" : "Enroll Now"}
          </button>
        </div>
      </div>
    </article>
  );
}
