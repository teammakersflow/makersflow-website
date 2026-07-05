import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { FeaturedCourses } from "@/components/landing/FeaturedCourses";
import { StoreDemo } from "@/components/landing/StoreDemo";
import { Testimonials } from "@/components/landing/Testimonials";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

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
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <StatsBar />
      <FeaturedCourses />
      <StoreDemo />
      <Testimonials />
      <CtaSection />
      <Footer />
    </main>
  );
}
