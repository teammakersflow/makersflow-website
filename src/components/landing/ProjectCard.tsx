import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BorderGlow from "@/components/BorderGlow";
import type { CourseCard as SupabaseCourse } from "@/lib/landing-data";

export function ProjectCard({ project }: { project: SupabaseCourse }) {
  return (
    <article className="card-lift group flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <BorderGlow
        borderRadius={16}
        glowColor="277 80 60"
        colors={["#FF6B35", "#4F46E5", "#10B981"]}
        backgroundColor="transparent"
        glowIntensity={0.6}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={`${project.title} project`}
              loading="lazy"
              width={900}
              height={640}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-build/30 to-primary/30 font-display text-xl font-bold text-foreground">
              {project.category ?? "Hardware Build"}
            </div>
          )}
          <Badge className="absolute left-4 top-4 rounded-full bg-background/85 text-foreground backdrop-blur">
            {project.level ?? "Intermediate"}
          </Badge>
        </div>
      </BorderGlow>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-lg font-semibold">{project.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          Hands-on build project focusing on {project.category ?? "Robotics"} hardware and code.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          <li>
            <Badge variant="secondary" className="rounded-full font-normal">
              {project.category ?? "Electronics"}
            </Badge>
          </li>
          <li>
            <Badge variant="secondary" className="rounded-full font-normal">
              Hardware
            </Badge>
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            2-4 Hours
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="size-4" aria-hidden="true" />
            Hardware Kit
          </span>
        </div>

        <Link
          to="/course/$id"
          params={{ id: project.id }}
          className="mt-6 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-primary"
        >
          Build This
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
