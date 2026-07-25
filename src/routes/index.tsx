import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import CurvedLoop from "@/components/CurvedLoop";
import { StatsBar } from "@/components/landing/StatsBar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturedCourses } from "@/components/landing/FeaturedCourses";
import { Categories } from "@/components/landing/Categories";
import { StoreDemo } from "@/components/landing/StoreDemo";
import { Testimonials } from "@/components/landing/Testimonials";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";
import DotField from "@/components/DotField";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MakersFlow — Learn Robotics, AI & IoT, anywhere" },
      {
        name: "description",
        content:
          "India's most exciting way to learn Robotics, AI, Electronics, IoT and Programming. Project-based courses, expert mentors, certificates.",
      },
      { property: "og:title", content: "MakersFlow — The Real Education" },
      {
        property: "og:description",
        content:
          "Project-based courses in Robotics, AI, Electronics, IoT and Programming. Be curious and never stop learning.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Full Landing Page Interactive DotField Matrix Background */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none opacity-85">
        <DotField
          dotRadius={2.0}
          dotSpacing={22}
          glowRadius={280}
          waveAmplitude={6}
          sparkle={true}
          gradientFrom="rgba(99, 102, 241, 0.65)"
          gradientTo="rgba(255, 107, 53, 0.45)"
        />
      </div>

      <div className="relative z-10">
        <Header />
        <Hero />
        <section
          aria-label="Brand Philosophy Marquee"
          className="relative py-4 border-y border-border/40 bg-card/30 backdrop-blur-md"
        >
          <CurvedLoop
            marqueeText="BUILD WITHOUT LIMITS • LAUNCH FAST • SCALE AUTOMATICALLY • MASTER MAKERSFLOW • "
            speed={1.5}
            curveAmount={80}
            className="fill-primary text-sm sm:text-base tracking-[0.2em] font-display font-semibold uppercase opacity-90"
          />
        </section>
        <StatsBar />
        <HowItWorks />
        <FeaturedCourses />
        <Categories />
        <StoreDemo />
        <Testimonials />
        <CtaSection />
        <Footer />
      </div>
    </main>
  );
}
