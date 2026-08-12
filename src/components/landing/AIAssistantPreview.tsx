import { Link } from "@tanstack/react-router";
import { ArrowRight, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const aiCapabilities = [
  "Hardware component selection",
  "Circuit wiring & pinout guides",
  "Code debugging (C++, Python, Arduino)",
  "3D printing & CAD advice",
  "Sensors & IoT setup help",
  "Project troubleshooting",
];

export function AIAssistantPreview() {
  const handleAssistantClick = () => {
    toast.info("AI Maker Assistant is launching soon! Join the community waitlist.");
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div className="min-w-0">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          AI Maker Assistant
        </p>
        <h2 className="text-balance text-3xl font-bold sm:text-4xl">
          Meet Your AI Maker Assistant.
        </h2>
        <p className="mt-4 text-lg text-foreground">Stuck on a project? Don't stop building.</p>
        <p className="mt-2 text-pretty text-muted-foreground">
          Get help understanding concepts, debugging code, choosing components and solving problems
          while you build.
        </p>

        <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {aiCapabilities.map((capability) => (
            <li key={capability} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {capability}
            </li>
          ))}
        </ul>

        <Button asChild size="lg" className="mt-8 min-h-12 font-semibold" onClick={handleAssistantClick}>
          <Link to="/community">
            Join Assistant Waitlist
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <div className="relative min-w-0">
        <div
          className="pointer-events-none absolute -inset-6 rounded-3xl bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="glow-primary relative rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Bot className="size-5" aria-hidden="true" />
              </span>
              <span className="font-display text-sm font-semibold">Maker Assistant</span>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Preview
            </span>
          </div>
          <div className="space-y-3 pt-4">
            <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-secondary px-4 py-3 text-sm">
              My ultrasonic sensor keeps returning 0 — what should I check first?
            </p>
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              Interface preview. AI responses appear here when building with your MakersFlow kits.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
