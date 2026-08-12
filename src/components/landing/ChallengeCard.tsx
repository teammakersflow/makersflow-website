import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Icon } from "./icon";

export type Challenge = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  link?: string;
};

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const targetRoute = challenge.link ?? (challenge.slug.includes("30-day") ? "/challenges/30-day" : "/challenges/innovation");

  return (
    <article className="card-lift group relative overflow-hidden rounded-2xl border border-border bg-card p-6">
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-build/10 blur-2xl"
        aria-hidden="true"
      />
      <span className="grid size-12 place-items-center rounded-xl bg-secondary text-build">
        <Icon name={challenge.icon} className="size-6" />
      </span>
      <h3 className="mt-5 font-display text-lg font-semibold">{challenge.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{challenge.description}</p>
      <Link
        to={targetRoute}
        className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-build"
      >
        Join Challenge
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </article>
  );
}
