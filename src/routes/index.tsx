import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Hammer, Package, Share2 } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Section, SectionHeading } from "@/components/landing/SectionHeading";
import { TechnologyCard, type Technology } from "@/components/landing/TechnologyCard";
import { LearningPathCard, type LearningPath } from "@/components/landing/LearningPathCard";
import { CourseCard } from "@/components/landing/CourseCard";
import { ProjectCard } from "@/components/landing/ProjectCard";
import { ChallengeCard, type Challenge } from "@/components/landing/ChallengeCard";
import { AIAssistantPreview } from "@/components/landing/AIAssistantPreview";
import { StatsSection } from "@/components/landing/StatsSection";
import { CTASection } from "@/components/landing/CTASection";
import { TestimonialGrid } from "@/components/landing/TestimonialCard";
import { Icon } from "@/components/landing/icon";
import { Footer } from "@/components/landing/Footer";
import LogoLoop from "@/components/LogoLoop";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/auth";
import { fetchFeaturedCourses } from "@/lib/landing-data";
import { supabase } from "@/integrations/supabase/client";

const title = "MakersFlow — Learn, Build & Create with Robotics, AI, IoT & Electronics";
const description =
  "Learn robotics, AI, electronics, IoT and coding through hands-on courses and real-world projects. Build with MakersFlow kits, explore challenges and become a maker.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://makersflow.in/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://makersflow.in/makersflow-logo-dark.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "https://makersflow.in/makersflow-logo-dark.png" },
    ],
    links: [{ rel: "canonical", href: "https://makersflow.in/" }],
  }),
  component: LandingPage,
});

const pillars = [
  {
    icon: BookOpen,
    title: "Learn",
    copy: "Structured courses designed to take you from fundamentals to real-world applications.",
  },
  {
    icon: Hammer,
    title: "Build",
    copy: "Follow step-by-step projects and turn concepts into working prototypes.",
  },
  {
    icon: Package,
    title: "Get the Hardware",
    copy: "Find the components, kits and tools you need to bring your ideas to life.",
  },
  {
    icon: Share2,
    title: "Showcase",
    copy: "Document your projects, share your work and build your maker portfolio.",
  },
];

const technologies: Technology[] = [
  {
    slug: "robotics",
    name: "Robotics",
    description: "Build autonomous rovers, robotic arms, and intelligent machines.",
    icon: "Bot",
    cta: "Explore Robotics",
  },
  {
    slug: "ai-ml",
    name: "AI & ML",
    description: "Computer vision, neural networks, and embedded AI on edge devices.",
    icon: "Brain",
    cta: "Explore AI",
  },
  {
    slug: "iot",
    name: "IoT & Wireless",
    description: "Connect sensors, microcontrollers, and cloud dashboards.",
    icon: "Radio",
    cta: "Explore IoT",
  },
  {
    slug: "electronics",
    name: "Electronics",
    description: "Master breadboarding, PCB design, sensors, and circuit fundamentals.",
    icon: "CircuitBoard",
    cta: "Explore Electronics",
  },
  {
    slug: "programming",
    name: "Programming",
    description: "Python, C++, Arduino, and ROS2 for real-world robotics control.",
    icon: "Code2",
    cta: "Explore Coding",
  },
  {
    slug: "3d-design",
    name: "3D Design & CAD",
    description: "Design custom enclosures, mechanical chassis, and 3D print parts.",
    icon: "Hammer",
    cta: "Explore 3D Design",
  },
];

const learningPaths: LearningPath[] = [
  {
    slug: "beginner",
    step: "01",
    title: "Beginner Maker",
    description: "Start with zero experience. Learn circuits, simple coding, and basic mechanics.",
    cta: "Start Path",
  },
  {
    slug: "building",
    step: "02",
    title: "Project Builder",
    description: "Assemble hardware kits, write embedded Python/C++, and interface sensors.",
    cta: "Start Path",
  },
  {
    slug: "ai",
    step: "03",
    title: "AI Specialist",
    description: "Train vision models, deploy edge AI, and build smart autonomous systems.",
    cta: "Start Path",
  },
  {
    slug: "engineer",
    step: "04",
    title: "Hardware Engineer",
    description: "Design custom PCBs, program microcontrollers, and deploy production hardware.",
    cta: "Start Path",
  },
];

const storeCategories = [
  {
    slug: "robotics-kits",
    name: "Robotics Kits",
    description: "Complete kits with motors, chassis, wheels, and control boards.",
    icon: "Bot",
  },
  {
    slug: "electronics",
    name: "Electronics & Sensors",
    description: "Breadboards, resistors, OLED displays, and environmental sensors.",
    icon: "CircuitBoard",
  },
  {
    slug: "iot-modules",
    name: "IoT & Microcontrollers",
    description: "ESP32, Arduino Uno, Raspberry Pi Pico, and Wi-Fi modules.",
    icon: "Radio",
  },
  {
    slug: "ai-hardware",
    name: "AI & Camera Kits",
    description: "Edge AI cameras, neural accelerators, and OpenCV kits.",
    icon: "Brain",
  },
  {
    slug: "components",
    name: "Tools & Components",
    description: "Soldering irons, jumpers, battery packs, and hardware tools.",
    icon: "Wrench",
  },
];

const howItWorks = [
  {
    step: "Step 01",
    title: "Choose Your Path",
    description: "Select a course or hardware kit aligned with what you want to build.",
  },
  {
    step: "Step 02",
    title: "Get the Hardware",
    description: "Receive complete component kits delivered right to your doorstep.",
  },
  {
    step: "Step 03",
    title: "Build & Code",
    description: "Follow interactive step-by-step video lessons and wiring guides.",
  },
  {
    step: "Step 04",
    title: "Showcase & Compete",
    description: "Publish your build, join challenges, and earn verified certificates.",
  },
];

const communityProjects = [
  {
    slug: "autonomous-rover",
    title: "Autonomous Obstacle Avoiding Rover",
    creator: "Kabir Sharma",
    technologies: ["Arduino", "Ultrasonic", "Robotics"],
    image: "/course-thumbnails/arduino-uno-q-spotted-in-the-wild-v0-badkp3lmibwf1.webp",
  },
  {
    slug: "smart-plant-monitor",
    title: "IoT Smart Agriculture Monitor",
    creator: "Ananya Patel",
    technologies: ["ESP32", "Sensors", "IoT"],
    image: "/course-thumbnails/EC-IoT-Internet-of-Things-750.webp",
  },
  {
    slug: "gesture-control-arm",
    title: "AI Vision Gesture Arm",
    creator: "Rohan & Team",
    technologies: ["Python", "OpenCV", "AI"],
    image: "/course-thumbnails/aiml003-1024x640.webp",
  },
];

const challenges: Challenge[] = [
  {
    slug: "30-day",
    title: "30-Day Innovation Challenge",
    description: "Solve real-world problems through daily progress tracking and weekly missions.",
    icon: "Rocket",
    link: "/challenges/30-day",
  },
  {
    slug: "innovation",
    title: "MakersFlow Innovation Challenge",
    description: "Submit what you built with your kit to win 20% cashback, certificates, and features.",
    icon: "Hammer",
    link: "/challenges/innovation",
  },
];

const hardwareLogos = [
  { node: <span className="font-display font-bold text-sm tracking-wider text-muted-foreground">ARDUINO</span> },
  { node: <span className="font-display font-bold text-sm tracking-wider text-muted-foreground">RASPBERRY PI</span> },
  { node: <span className="font-display font-bold text-sm tracking-wider text-muted-foreground">ESP32</span> },
  { node: <span className="font-display font-bold text-sm tracking-wider text-muted-foreground">PYTHON</span> },
  { node: <span className="font-display font-bold text-sm tracking-wider text-muted-foreground">ROS2</span> },
  { node: <span className="font-display font-bold text-sm tracking-wider text-muted-foreground">OPENCV</span> },
  { node: <span className="font-display font-bold text-sm tracking-wider text-muted-foreground">TENSORFLOW</span> },
];

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, user, navigate]);

  const { data: featuredCourses = [] } = useQuery({
    queryKey: ["landing", "featured-courses"],
    queryFn: fetchFeaturedCourses,
    staleTime: 60_000,
  });

  const { data: projectCourses = [] } = useQuery({
    queryKey: ["landing", "project-courses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, category, level, price, gst_rate, is_free, thumbnail_url, instructor:profiles!courses_instructor_id_fkey(full_name)")
        .eq("is_published", true)
        .in("category", ["Robotics", "IoT", "Electronics"])
        .limit(4);

      if (!data) return [];
      return data.map((c: any) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        level: c.level,
        price: c.price,
        original_price: c.price ? Math.round(c.price * 1.25) : null,
        is_free: c.is_free,
        thumbnail_url: c.thumbnail_url,
        rating: c.rating ?? 4.8,
        total_reviews: c.total_reviews ?? 18,
        instructor_name: c.instructor?.full_name ?? null,
        gst_rate: c.gst_rate ?? 18,
      }));
    },
    staleTime: 60_000,
  });

  if (loading || user) return null;

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <Header />
      <Hero />

      {/* Hardware Ecosystem Logo Loop Ticker */}
      <section aria-label="Hardware Ecosystem Marquee" className="py-6 border-y border-border/40 bg-card/30">
        <LogoLoop logos={hardwareLogos} speed={30} gap={48} />
      </section>

      {/* Four Pillars */}
      <Section>
        <SectionHeading
          title="Everything You Need to Become a Maker."
          subtitle="MakersFlow is a hands-on learning and innovation platform designed for students, educators, hobbyists and aspiring engineers. Learn emerging technologies, follow guided projects, build with real hardware, experiment with ideas and showcase what you create."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="card-lift group rounded-2xl border border-border bg-card p-6"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <pillar.icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{pillar.copy}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Technologies */}
      <Section className="border-y border-border bg-card/30">
        <SectionHeading eyebrow="Technologies" title="Explore the World of Making" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {technologies.map((technology) => (
            <TechnologyCard key={technology.slug} technology={technology} />
          ))}
        </div>
      </Section>

      {/* Learning Paths */}
      <Section>
        <SectionHeading eyebrow="Learning paths" title="Where Do You Want to Start?" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {learningPaths.map((path) => (
            <LearningPathCard key={path.slug} path={path} />
          ))}
        </div>
      </Section>

      {/* Featured Courses */}
      <Section className="border-y border-border bg-card/30">
        <SectionHeading
          title="Learn Skills. Build Projects."
          subtitle="Short, practical courses designed around what you can actually build."
          action={
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/explore">
                All courses
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredCourses.slice(0, 6).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </Section>

      {/* Projects */}
      <Section>
        <SectionHeading
          eyebrow="Projects"
          title="Learn by Building."
          subtitle="The fastest way to understand technology is to build something with it."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {projectCourses.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        <div className="mt-10">
          <Button asChild size="lg" variant="outline" className="min-h-12">
            <Link to="/explore" search={{ category: "Robotics" }}>
              Explore All Projects
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* Store Categories */}
      <Section className="border-y border-border bg-card/30">
        <SectionHeading
          eyebrow="Store"
          title="Everything You Need to Build."
          subtitle="From your first circuit to your next robot, get the hardware and tools you need to turn ideas into reality."
          action={
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/store">
                Visit the store
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {storeCategories.map((category) => (
            <Link
              key={category.slug}
              to="/store"
              className="card-lift group rounded-2xl border border-border bg-card p-6"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-build">
                <Icon name={category.icon} className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{category.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* AI Assistant Preview */}
      <Section>
        <AIAssistantPreview />
      </Section>

      {/* How it Works */}
      <Section className="border-y border-border bg-card/30">
        <SectionHeading eyebrow="How it works" title="From Idea to Innovation." />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((item) => (
            <li key={item.step} className="relative rounded-2xl border border-border bg-card p-6">
              <span className="font-display text-sm font-bold text-primary">{item.step}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Button asChild size="lg" className="min-h-12 font-semibold">
            <Link to="/explore">
              Start Your First Project
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* Community */}
      <Section>
        <SectionHeading
          eyebrow="Community"
          title="Made by Makers."
          subtitle="See what other creators are building, share your projects and get inspired."
          action={
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/community">
                View Community
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {communityProjects.map((item) => (
            <article
              key={item.slug}
              className="card-lift overflow-hidden rounded-2xl border border-border bg-card"
            >
              <img
                src={item.image}
                alt={`${item.title} by ${item.creator}`}
                loading="lazy"
                width={900}
                height={640}
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="p-5">
                <h3 className="font-display text-base font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Built by {item.creator} · {item.technologies.join(" · ")}
                </p>
                <Link
                  to="/community"
                  className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  View Project
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* Challenges */}
      <Section className="border-y border-border bg-card/30">
        <SectionHeading
          eyebrow="Challenges"
          title="Build. Compete. Innovate."
          subtitle="Put your skills to the test through real-world challenges."
          action={
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/challenges/30-day">
                Explore Challenges
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.slug} challenge={challenge} />
          ))}
        </div>
      </Section>

      {/* Schools & Educators */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-8">
            <h2 className="text-balance font-display text-2xl font-bold sm:text-3xl">
              Bring MakersFlow to Your School.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Give students access to structured STEM learning, hands-on projects and emerging
              technologies — without having to build everything from scratch.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="min-h-11 font-semibold">
                <Link to="/contact" search={{ topic: "school" }}>
                  For Schools
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-h-11">
                <Link to="/contact">Talk to Our Team</Link>
              </Button>
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-card p-8">
            <h2 className="text-balance font-display text-2xl font-bold sm:text-3xl">
              Teach. Inspire. Build.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Give your students the tools to learn technology by doing.
            </p>
            <div className="mt-6">
              <Button asChild variant="outline" className="min-h-11">
                <Link to="/contact" search={{ topic: "educator" }}>
                  Explore Educator Resources
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </article>
        </div>
      </Section>

      {/* Impact Stats */}
      <Section className="pt-0">
        <StatsSection />
      </Section>

      {/* Testimonials */}
      <Section>
        <SectionHeading eyebrow="Testimonials" title="What Makers Say" />
        <div className="mt-10">
          <TestimonialGrid />
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="pt-0">
        <CTASection />
      </Section>

      <Footer />
    </main>
  );
}
