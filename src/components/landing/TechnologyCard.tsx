import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Icon } from "./icon";

export type Technology = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  cta: string;
};

export function TechnologyCard({ technology }: { technology: Technology }) {
  return (
    <article className="card-lift group relative overflow-hidden rounded-2xl border border-border bg-card p-6">
      <span className="grid size-12 place-items-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon name={technology.icon} className="size-6" />
      </span>
      <h3 className="mt-5 font-display text-xl font-semibold">{technology.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{technology.description}</p>
      <Link
        to="/explore"
        search={{ category: technology.name }}
        className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary"
      >
        {technology.cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </article>
  );
}
