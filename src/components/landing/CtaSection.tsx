import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-12">
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-56 w-2/3 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <h2 className="relative text-balance text-3xl font-bold sm:text-4xl">
        Your Next Idea Could Be Your Best One Yet.
      </h2>
      <p className="relative mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
        Learn something new. Build something real. Share what you create.
      </p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="min-h-12 font-semibold">
          <Link to="/explore">
            Start Building
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="min-h-12">
          <Link to="/explore">Explore Courses</Link>
        </Button>
      </div>
    </div>
  );
}

// Alias re-export for backward compatibility with existing imports
export { CTASection as CtaSection };
