import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export type LearningPath = {
  slug: string;
  step: string;
  title: string;
  description: string;
  cta: string;
};

const destinations: Record<string, "/explore"> = {
  beginner: "/explore",
  building: "/explore",
  ai: "/explore",
  engineer: "/explore",
};

export function LearningPathCard({ path }: { path: LearningPath }) {
  return (
    <article className="card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6">
      <span className="font-display text-sm font-bold text-primary">{path.step}</span>
      <div className="mt-3 h-1 w-full rounded-full bg-secondary">
        <div
          className="h-1 rounded-full bg-primary transition-all"
          style={{ width: `${Number(path.step) * 25}%` }}
          aria-hidden="true"
        />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold">{path.title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{path.description}</p>
      <Link
        to={destinations[path.slug] ?? "/explore"}
        className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary"
      >
        {path.cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </article>
  );
}
