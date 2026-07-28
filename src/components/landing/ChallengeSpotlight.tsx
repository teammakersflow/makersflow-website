import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Award, CalendarDays, Rocket, Trophy } from "lucide-react";

/**
 * The two challenge programmes, surfaced directly under the hero on the
 * landing page. Each card is a router <Link>, so it navigates in the same tab
 * rather than opening a new one.
 */

const CHALLENGES = [
  {
    to: "/challenges/30-day",
    eyebrow: "EDODWAJA",
    title: "30-Day Innovation Challenge",
    tagline: "Think. Build. Innovate.",
    description:
      "Solve real-world problems and showcase your creativity through daily progress and weekly challenges.",
    icon: CalendarDays,
    highlights: ["4 weekly missions", "Daily progress tracking", "Leaderboard & certificates"],
    cta: "View the challenge",
    gradient: "from-primary/20 via-primary/5 to-transparent",
  },
  {
    to: "/challenges/innovation",
    eyebrow: "MakersFlow · 2026",
    title: "MakersFlow Innovation Challenge",
    tagline: "Built something with your kit? Get rewarded.",
    description:
      "Turn your creativity into recognition. Submit what you built with your MakersFlow kit and get featured.",
    icon: Trophy,
    highlights: ["20% cashback", "Digital certificate", "Future Innovators Wall"],
    cta: "Submit your innovation",
    gradient: "from-accent/20 via-accent/5 to-transparent",
  },
] as const;

export function ChallengeSpotlight() {
  return (
    <section
      id="challenges"
      aria-label="Innovation challenges"
      className="relative scroll-mt-36 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              <Rocket className="h-3.5 w-3.5" /> Open for entries
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Join a <span className="text-primary">challenge</span>
            </h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Two ways to put your ideas in front of people — build for 30 days, or submit what you've
            already made.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {CHALLENGES.map((challenge, index) => (
            <motion.div
              key={challenge.to}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
            >
              <Link
                to={challenge.to}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 outline-none transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-glow-primary)] focus-visible:ring-2 focus-visible:ring-primary sm:p-9"
              >
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${challenge.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />

                <div className="relative flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <challenge.icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {challenge.eyebrow}
                  </span>
                </div>

                <h3 className="relative mt-6 font-display text-2xl font-bold text-foreground sm:text-3xl">
                  {challenge.title}
                </h3>
                <p className="relative mt-1 font-semibold text-primary">{challenge.tagline}</p>
                <p className="relative mt-3 text-muted-foreground">{challenge.description}</p>

                <ul className="relative mt-6 flex flex-wrap gap-2">
                  {challenge.highlights.map((h) => (
                    <li
                      key={h}
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground"
                    >
                      <Award className="h-3 w-3 text-accent" />
                      {h}
                    </li>
                  ))}
                </ul>

                <span className="relative mt-7 inline-flex items-center gap-2 font-semibold text-primary">
                  {challenge.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
