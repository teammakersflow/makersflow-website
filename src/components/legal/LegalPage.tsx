import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import type { LegalSection } from "@/lib/legal-content";
import { Header } from "@/components/landing/Header";

type Props = {
  kind: "privacy" | "terms";
  title: string;
  subtitle: string;
  updated: string;
  sections: LegalSection[];
};

export function LegalPage({ kind, title, subtitle, updated, sections }: Props) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const handler = () => {
      // Active section = the last heading above the top viewport offset
      const offset = 140;
      let current = sections[0]?.id ?? "";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - offset <= 0) {
          current = s.id;
        }
      }
      setActiveId(current);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-light shadow-[var(--shadow-glow-primary)]">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{subtitle}</p>
          <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
            Last updated · {updated}
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[240px,1fr]">
          {/* TOC */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24">
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                On this page
              </div>
              <ul className="space-y-0.5 border-l border-border">
                {sections.map((s) => {
                  const active = activeId === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => scrollTo(s.id)}
                        className={cn(
                          "relative block w-full text-left text-sm leading-snug transition-colors",
                          "py-1.5 pl-4 pr-2",
                          active
                            ? "font-semibold text-primary"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {active && (
                          <span className="absolute -left-px top-0 h-full w-0.5 rounded-full bg-gradient-to-b from-primary to-accent" />
                        )}
                        {s.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-6 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
                Have questions?{" "}
                <a
                  href={
                    kind === "privacy"
                      ? "mailto:privacy@makersflow.com"
                      : "mailto:support@makersflow.com"
                  }
                  className="font-semibold text-primary hover:underline"
                >
                  Email us
                </a>
              </div>
            </nav>
          </aside>

          {/* Content */}
          <article className="space-y-12">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28 rounded-2xl bg-card p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold text-foreground">{s.title}</h2>
                {s.paragraphs?.map((p, i) => (
                  <p key={i} className="mt-4 leading-relaxed text-foreground/80">
                    {p}
                  </p>
                ))}
                {s.bullets && (
                  <ul className="mt-4 space-y-2">
                    {s.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-foreground/80">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent" />
                        <span className="leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                ← Back home
              </Link>
              <Link
                to={kind === "privacy" ? "/terms" : "/privacy"}
                className="font-semibold text-primary hover:underline"
              >
                {kind === "privacy" ? "Read our Terms →" : "Read our Privacy Policy →"}
              </Link>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
