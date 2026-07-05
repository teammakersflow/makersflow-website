import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Award,
  Compass,
  Mail,
  Youtube,
  Linkedin,
  Instagram,
  Twitter,
  Github,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "MakersFlow Community — Connect & Build" },
      {
        name: "description",
        content:
          "Join the MakersFlow builder community. Share robotics and coding projects, get mentor support, join study groups, and connect with other students in India.",
      },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email address is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);

    toast.success("Success! You've been added to the community waitlist.");
    setEmail("");
  };

  const SOCIALS = [
    { name: "LinkedIn", icon: Linkedin, placeholder: "[Add your LinkedIn profile link]" },
    { name: "Instagram", icon: Instagram, placeholder: "[Add your Instagram profile link]" },
    { name: "YouTube", icon: Youtube, placeholder: "[Add your YouTube channel link]" },
    { name: "Twitter / X", icon: Twitter, placeholder: "[Add your Twitter profile link]" },
    { name: "GitHub", icon: Github, placeholder: "[Add your GitHub organization link]" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between pt-16">
      <div>
        <Header />

        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

          <div className="mx-auto max-w-4xl px-5 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-light shadow-[var(--shadow-glow-accent)]">
              <Users className="h-6 w-6 text-accent-foreground" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              The MakersFlow Community
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
              Connect with fellow student builders, electronics enthusiasts, and tech creators
              across India. Share your projects, get advice from expert mentors, and form local
              study groups.
            </p>
          </div>
        </section>

        {/* Feature Cards Section */}
        <main className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1: Forums */}
            <Card className="border border-border/80 bg-card shadow-elegant rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <CardTitle className="font-display text-lg font-bold">Discussion Forums</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Have a bug in your Arduino code or a component issue? Post questions, troubleshoot
                  with peers, and get answers from experienced mentors in our dedicated space.
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Showcases */}
            <Card className="border border-border/80 bg-card shadow-elegant rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Award className="h-5 w-5" />
                </div>
                <CardTitle className="font-display text-lg font-bold">Student Showcases</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Finished building a robotics kit, an IoT weather station, or an AI chatbot? Show
                  off your work, share code repositories, upload videos, and inspire fellow
                  learners.
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Study Groups */}
            <Card className="border border-border/80 bg-card shadow-elegant rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Compass className="h-5 w-5" />
                </div>
                <CardTitle className="font-display text-lg font-bold">
                  Study & Build Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Find students near you or within your school. Collaborate on engineering
                  challenges, practice for robotics competitions, or work through courses together.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Waitlist Call to Action */}
          <div className="mt-16 max-w-2xl mx-auto">
            <Card className="border border-border bg-card shadow-elegant rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              {/* Decorative orange glow */}
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

              <div className="text-center space-y-4 relative">
                <h2 className="font-display text-2xl font-bold">Join the Waitlist</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Our community platform is launching soon. Submit your email below to receive an
                  early access invite and be the first to know.
                </p>
                <form
                  onSubmit={handleSubmit}
                  className="mt-6 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
                >
                  <div className="flex-1 space-y-1 text-left">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      className={error ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {error && <p className="text-xs text-destructive font-medium pl-1">{error}</p>}
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 font-semibold bg-gradient-to-r from-accent to-accent-light text-accent-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 shadow-[var(--shadow-glow-accent)] cursor-pointer shrink-0"
                  >
                    {isSubmitting ? "Joining..." : "Notify Me"}
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Social Links Section */}
          <div className="mt-20 border-t border-border/80 pt-12 text-center">
            <h2 className="font-display text-xl font-bold">Follow Our Journey</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Check out our social channels for updates, student projects highlights, and STEM
              inspiration.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {SOCIALS.map((soc) => {
                const Icon = soc.icon;
                return (
                  <div
                    key={soc.name}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-card text-muted-foreground text-xs select-none transition-all hover:border-primary/25 hover:text-primary"
                    title={soc.placeholder}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-semibold text-foreground">{soc.name}</span>
                    <span className="text-[10px] text-muted-foreground italic font-normal">
                      {soc.placeholder}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
