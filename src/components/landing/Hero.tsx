import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextType from "@/components/TextType";

const strip = ["Robotics", "AI", "IoT", "Electronics", "Coding", "3D Design"];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:pb-24">
        <div className="min-w-0">
          <p className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Hands-on maker ecosystem
          </p>
          <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            Don't Just Learn Technology.{" "}
            <TextType
              text={["Build It.", "Master AI.", "Innovate.", "Create."]}
              as="span"
              className="text-primary inline-block"
              typingSpeed={70}
              deletingSpeed={40}
              pauseDuration={2500}
            />
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Learn robotics, AI, electronics, IoT, coding and emerging technologies through practical
            courses, real-world projects and the hardware you need to build them.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="min-h-12 font-semibold">
              <Link to="/explore">
                Start Learning
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-12">
              <Link to="/explore" search={{ category: "Robotics" }}>Explore Projects</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            {strip.map((item, index) => (
              <li key={item} className="flex items-center gap-3">
                {index > 0 ? (
                  <span className="text-border" aria-hidden="true">
                    •
                  </span>
                ) : null}
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="group relative min-w-0">
          <div
            className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-primary/15 via-transparent to-build/15 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
            <img
              src="/course-thumbnails/arduino-uno-q-spotted-in-the-wild-v0-badkp3lmibwf1.webp"
              alt="Maker workspace with a wheeled robot, ESP32 on a breadboard, PCB, 3D printed parts and a laptop showing code"
              width={1408}
              height={1104}
              fetchPriority="high"
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
