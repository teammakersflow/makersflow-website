import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpecularButton from "@/components/SpecularButton";

export function CTASection() {
  const navigate = useNavigate();

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
      <div className="relative mt-8 flex flex-wrap justify-center items-center gap-3">
        <SpecularButton
          size="lg"
          radius={14}
          baseColor="#4F46E5"
          lineColor="#60A5FA"
          textColor="#ffffff"
          onClick={() => navigate({ to: "/explore" })}
          className="font-semibold"
        >
          Start Building
          <ArrowRight className="inline-block size-4 ml-2" aria-hidden="true" />
        </SpecularButton>
        <Button asChild size="lg" variant="outline" className="min-h-12">
          <Link to="/explore">Explore Courses</Link>
        </Button>
      </div>
    </div>
  );
}

// Alias re-export for backward compatibility with existing imports
export { CTASection as CtaSection };
