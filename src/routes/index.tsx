import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ChallengeSpotlight } from "@/components/landing/ChallengeSpotlight";
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
import { useAuth } from "@/integrations/supabase/auth";

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
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, user, navigate]);

  // While auth is resolving, render nothing — avoids flash of marketing page
  // for logged-in users who will be redirected to /dashboard immediately.
  if (loading || user) return null;

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Full Landing Page Interactive DotField Matrix Background */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none opacity-85">
        <DotField
          dotRadius={2.0}
          dotSpacing={22}
          glowRadius={140}
          waveAmplitude={6}
          sparkle={true}
          gradientFrom="rgba(99, 102, 241, 0.65)"
          gradientTo="rgba(255, 107, 53, 0.45)"
        />
      </div>

      <div className="relative z-10">
        <Header />
        <Hero />
        <ChallengeSpotlight />
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
        <Categories />
        <FeaturedCourses />
        <StoreDemo />
        <HowItWorks />
        <Testimonials />
        <CtaSection />
        <Footer />
      </div>
    </main>
  );
}
