import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  Handshake,
  Lightbulb,
  Loader2,
  Medal,
  Presentation,
  Search,
  Sparkles,
  Star,
  Trophy,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import {
  Card,
  CardTitle,
  FaqList,
  Grid,
  Section,
  SectionHeading,
  SelectField,
  StatBox,
  TextField,
} from "@/components/challenges/ChallengeUI";
import { apiClient } from "@/lib/auth/apiClient";

export const Route = createFileRoute("/challenges/30-day")({
  head: () => ({
    meta: [
      { title: "30-Day Innovation Challenge — MakersFlow" },
      {
        name: "description",
        content:
          "Think. Build. Innovate. Solve real-world problems and showcase your creativity through daily progress and weekly challenges.",
      },
    ],
  }),
  component: ThirtyDayChallengePage,
});

const WEEKS = [
  {
    week: "Week 1",
    body: "Build something useful using waste materials. Examples: Phone Holder, Pen Stand, Bird Feeder, Desk Organizer.",
  },
  {
    week: "Week 2",
    body: "Identify a problem in your home, school or community and propose a creative solution.",
  },
  {
    week: "Week 3",
    body: "Create a working model, STEM project, design sketch, app concept or engineering solution.",
  },
  {
    week: "Week 4",
    body: "Present your project through a video, PPT, poster or live demonstration.",
  },
];

const DAILY_STEPS = [
  "Day 1 – Planning",
  "Day 2 – Research & Materials",
  "Day 3 – Initial Build",
  "Day 4 – Development",
  "Day 5 – Improvements",
  "Day 6 – Final Build",
  "Day 7 – Showcase",
];

const OUTCOMES = [
  {
    icon: Lightbulb,
    title: "Creative Thinking",
    body: "Generate innovative ideas and solutions for real-world problems.",
  },
  {
    icon: Search,
    title: "Problem Solving",
    body: "Identify challenges and develop practical approaches to solve them.",
  },
  {
    icon: Wrench,
    title: "Prototype Development",
    body: "Transform concepts into working models, designs, or prototypes.",
  },
  {
    icon: Presentation,
    title: "Presentation Skills",
    body: "Learn to communicate ideas effectively through reports, videos and pitches.",
  },
  {
    icon: Handshake,
    title: "Collaboration",
    body: "Interact with peers, mentors and community members throughout the challenge.",
  },
  {
    icon: BadgeCheck,
    title: "Project Documentation",
    body: "Track progress, maintain evidence and showcase innovation systematically.",
  },
];

const SCORING = [
  { label: "Registration", points: "10 Points" },
  { label: "Daily Uploads", points: "20 Points" },
  { label: "Weekly Completion", points: "30 Points" },
  { label: "Final Project", points: "30 Points" },
  { label: "Community Participation", points: "10 Points" },
];

const GALLERY = [
  "Smart Dustbin",
  "Rainwater Harvesting",
  "Plant Watering System",
  "Smart Classroom",
];

const LEADERBOARD = [
  { rank: "🥇", name: "Master Innovator", score: 980 },
  { rank: "🥈", name: "Gold Innovator", score: 850 },
  { rank: "🥉", name: "Silver Innovator", score: 760 },
];

const TIMELINE = [
  { days: "Days 1–7", label: "Observe & Create" },
  { days: "Days 8–14", label: "Find Problems" },
  { days: "Days 15–21", label: "Build Solutions" },
  { days: "Days 22–30", label: "Present Innovation" },
];

const REWARDS = [
  { icon: Medal, title: "Participation", body: "Certificate for completion." },
  { icon: Trophy, title: "Top Innovator", body: "Special recognition." },
  { icon: Star, title: "Innovation Badge", body: "Digital achievement badge." },
  { icon: Award, title: "Leaderboard Feature", body: "Top performers showcased." },
];

const FAQS = [
  {
    q: "Do I need a team?",
    a: "No. Participants can join individually and complete the challenge on their own.",
  },
  {
    q: "Is there any registration fee?",
    a: "No. Participation in the 30-Day Innovation Challenge is completely free.",
  },
  {
    q: "Can I join after the challenge starts?",
    a: "Yes, but you may miss some activities and bonus points from earlier days.",
  },
  {
    q: "Do I need technical skills?",
    a: "No. Anyone with creativity and willingness to learn can participate.",
  },
  {
    q: "Will certificates be provided?",
    a: "Yes. Eligible participants will receive certificates after successful completion.",
  },
  {
    q: "Why do I need to upload progress photos?",
    a: "Progress photos help verify originality and showcase your innovation journey.",
  },
  {
    q: "Can school and college students participate?",
    a: "Yes. The challenge is open to students from schools, colleges and universities.",
  },
  {
    q: "What kind of projects can I submit?",
    a: "You can submit innovative ideas, prototypes, STEM models, community solutions, apps, designs or creative projects.",
  },
];

const CATEGORIES = [
  "Science",
  "Technology",
  "Environment",
  "Agriculture",
  "Healthcare",
  "Social Impact",
];

function ThirtyDayChallengePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-24">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/4 h-[40rem] w-[40rem] rounded-full bg-primary/20 opacity-40 blur-3xl" />
          <div className="absolute -bottom-40 right-1/4 h-[35rem] w-[35rem] rounded-full bg-accent/20 opacity-30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> EDODWAJA
          </p>

          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            30-Day <span className="text-primary">Innovation Challenge</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Think. Build. Innovate. Solve real-world problems and showcase your creativity through
            daily progress and weekly challenges.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#register"
              className="rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition hover:opacity-90"
            >
              🚀 Register Now
            </a>
            <a
              href="#roadmap"
              className="rounded-full border-2 border-primary px-7 py-3.5 font-semibold text-primary transition hover:bg-primary/10"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <Section id="about" muted>
        <SectionHeading eyebrow="About the challenge" title="30 Days of Creativity & Innovation" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatBox value="1000+" label="Students" />
          <StatBox value="50+" label="Schools" />
          <StatBox value="100+" label="Projects" />
          <StatBox value="30" label="Days" />
        </div>
      </Section>

      {/* ── Roadmap ──────────────────────────────────────────────────────── */}
      <Section id="roadmap">
        <SectionHeading
          eyebrow="How it works"
          title="Challenge Roadmap"
          description="Four weekly missions take you from a first idea to a finished presentation."
        />
        <Grid cols={4}>
          {WEEKS.map((w) => (
            <Card key={w.week} className="text-center">
              <CardTitle>{w.week}</CardTitle>
              <p className="text-sm text-muted-foreground">{w.body}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* ── Daily tracking + verification ────────────────────────────────── */}
      <Section muted>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>Daily Progress Tracking</CardTitle>
            <ul className="mt-3 space-y-2">
              {DAILY_STEPS.map((d) => (
                <li key={d} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  {d}
                </li>
              ))}
            </ul>
          </Card>

          <Card accent>
            <CardTitle>Authenticity Verification</CardTitle>
            <p className="text-sm text-muted-foreground">
              Participants must upload geo-tagged photos every day to verify originality and project
              progress.
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-background/60 p-4">
              <Camera className="h-5 w-5 shrink-0 text-accent" />
              <p className="text-sm text-foreground">
                Daily geo-tagged photo · keeps every entry original
              </p>
            </div>
          </Card>
        </div>
      </Section>

      {/* ── Learning outcomes ────────────────────────────────────────────── */}
      <Section id="outcomes">
        <SectionHeading
          eyebrow="Learning outcomes"
          title="What you'll walk away with"
          description="Skills participants will develop during the challenge."
        />
        <Grid cols={3}>
          {OUTCOMES.map((o) => (
            <Card key={o.title}>
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <o.icon className="h-5 w-5" />
              </span>
              <CardTitle>{o.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{o.body}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* ── Submission centre + scoring ──────────────────────────────────── */}
      <Section muted>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>Submission Center</CardTitle>
            <p className="mb-5 text-sm text-muted-foreground">
              Three checkpoints across the month.
            </p>
            <div className="flex flex-wrap gap-3">
              {["📸 Daily Upload", "🚀 Weekly Submission", "🏆 Final Project"].map((label) => (
                <a
                  key={label}
                  href="#register"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  {label}
                </a>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>Scoring System</CardTitle>
            <ul className="mt-3 divide-y divide-border">
              {SCORING.map((s) => (
                <li key={s.label} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold text-foreground">{s.points}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* ── Gallery ──────────────────────────────────────────────────────── */}
      <Section>
        <SectionHeading eyebrow="Inspiration" title="Innovation Gallery" />
        <Grid cols={4}>
          {GALLERY.map((g) => (
            <Card key={g} className="text-center">
              <p className="font-semibold text-foreground">{g}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* ── Leaderboard ──────────────────────────────────────────────────── */}
      <Section id="leaderboard" muted>
        <SectionHeading eyebrow="Rankings" title="Leaderboard" />
        <div className="mx-auto max-w-2xl space-y-3">
          {LEADERBOARD.map((l) => (
            <div
              key={l.name}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-4"
            >
              <span className="font-semibold text-foreground">
                {l.rank} {l.name}
              </span>
              <span className="font-display text-xl font-bold text-primary">{l.score}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      <Section>
        <SectionHeading eyebrow="Schedule" title="30-Day Timeline" />
        <div className="mx-auto max-w-3xl space-y-4">
          {TIMELINE.map((t) => (
            <div
              key={t.days}
              className="flex items-center gap-5 rounded-2xl border border-border bg-card p-5"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display font-bold text-primary">{t.days}</p>
                <p className="text-muted-foreground">{t.label}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Rewards ──────────────────────────────────────────────────────── */}
      <Section muted>
        <SectionHeading eyebrow="Recognition" title="Certificates & Rewards" />
        <Grid cols={4}>
          {REWARDS.map((r) => (
            <Card key={r.title} className="text-center">
              <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
                <r.icon className="h-5 w-5" />
              </span>
              <CardTitle>{r.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{r.body}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section id="faq">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently Asked Questions"
          description="Find answers to common questions about the challenge."
        />
        <FaqList items={FAQS} />
      </Section>

      {/* ── Registration ─────────────────────────────────────────────────── */}
      <Section id="register" muted>
        <SectionHeading
          eyebrow="Registration"
          title="Challenge Registration"
          description="Fill in your details to join the 30-Day Innovation Challenge."
        />
        <RegistrationForm />
      </Section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <Section id="contact">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-10 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">Contact Us</h2>
          <div className="mt-4 space-y-1 text-muted-foreground">
            <p>hello@edodwaja.com</p>
            <p>+91 XXXXX XXXXX</p>
            <p>Hyderabad, India</p>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          © 2026 EDODWAJA | 30-Day Innovation Challenge
        </p>
      </Section>

      <Footer />
    </main>
  );
}

// ─── Registration form ───────────────────────────────────────────────────────

const EMPTY_FORM = {
  full_name: "",
  age: "",
  email: "",
  phone: "",
  institution: "",
  class_year: "",
  city: "",
  project_category: "",
  motivation: "",
};

function RegistrationForm() {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): string | null => {
    if (form.full_name.trim().length < 2) return "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address";
    if (form.phone.replace(/\D/g, "").length < 10) return "Enter a valid 10-digit mobile number";
    if (form.institution.trim().length < 2) return "Enter your school or college name";
    return null;
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(true);
    try {
      await apiClient.post("/challenges/register", {
        full_name: form.full_name.trim(),
        age: form.age ? Number(form.age) : undefined,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/\D/g, "").slice(-10),
        institution: form.institution.trim(),
        class_year: form.class_year.trim() || undefined,
        city: form.city.trim() || undefined,
        project_category: form.project_category || undefined,
        motivation: form.motivation.trim() || undefined,
      });
      setDone(true);
      setForm({ ...EMPTY_FORM });
      toast.success("Registration submitted");
    } catch (err: any) {
      if (err?.status === 404) {
        toast.error("Registration isn't set up yet. Please contact hello@edodwaja.com.");
      } else {
        toast.error(err?.data?.message ?? "Could not submit your registration");
      }
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-primary/40 bg-primary/5 p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h3 className="mt-4 font-display text-2xl font-bold text-foreground">You're registered</h3>
        <p className="mt-2 text-muted-foreground">
          We've saved your details. Watch your email for the challenge kick-off.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-6 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary"
        >
          Register someone else
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 sm:p-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full Name" value={form.full_name} onChange={set("full_name")} required />
        <TextField
          label="Age"
          type="number"
          value={form.age}
          onChange={set("age")}
          min={5}
          max={100}
        />
        <TextField
          label="Email Address"
          type="email"
          value={form.email}
          onChange={set("email")}
          required
        />
        <TextField
          label="Mobile Number"
          type="tel"
          value={form.phone}
          onChange={set("phone")}
          required
        />
        <TextField
          label="School / College Name"
          value={form.institution}
          onChange={set("institution")}
          required
        />
        <TextField
          label="Class / Year of Study"
          value={form.class_year}
          onChange={set("class_year")}
        />
        <TextField label="City" value={form.city} onChange={set("city")} />
        <SelectField
          label="Project Category"
          value={form.project_category}
          onChange={set("project_category")}
          options={CATEGORIES}
          placeholder="Select Project Category"
        />
        <div className="sm:col-span-2">
          <TextField
            label="Why do you want to join this challenge?"
            value={form.motivation}
            onChange={set("motivation")}
            rows={5}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Registration
      </button>
    </div>
  );
}
