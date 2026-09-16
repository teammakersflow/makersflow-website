import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Gift,
  Loader2,
  PackageCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import {
  Card,
  CardTitle,
  FaqList,
  FileField,
  Grid,
  Section,
  SectionHeading,
  SelectField,
  TextField,
} from "@/components/challenges/ChallengeUI";
import { apiClient } from "@/lib/auth/apiClient";

export const Route = createFileRoute("/challenges/innovation")({
  head: () => ({
    meta: [
      { title: "MakersFlow Innovation Challenge 2026" },
      {
        name: "description",
        content:
          "Built something unique with your MakersFlow kit? Submit your innovation for 20% cashback, a digital certificate and a place on the Future Innovators Wall.",
      },
    ],
  }),
  component: InnovationChallengePage,
});

const WHY_PARTICIPATE = [
  "Get a chance to receive 20% Cashback",
  "Earn a Digital Innovation Certificate",
  "Get featured on the Future Innovators Wall",
  "Showcase your creativity to students across India",
  "Inspire other young innovators with your ideas",
];

const WALL = [
  { name: "Future Innovator", project: "Smart Lamp Project" },
  { name: "Future Innovator", project: "Water Saver Project" },
  { name: "Future Innovator", project: "Traffic Solution Project" },
];

const REWARDS = [
  {
    title: "How to Participate",
    body: "Build a MakersFlow kit, improve it, and submit your innovation.",
  },
  {
    title: "Rewards",
    body: "20% Cashback, Digital Certificate, Future Innovators Wall Feature, and Social Recognition.",
  },
  {
    title: "Evaluation",
    body: "Creativity 40%, Practical Use 25%, Technical Understanding 20%, Presentation 15%.",
  },
  {
    title: "Timeline",
    body: "Evaluation takes 7–10 working days. Winners announced monthly.",
  },
  {
    title: "📸 Public Recognition",
    body: "Your innovation and photo may be showcased on the Future Innovators Wall.",
  },
];

const GUIDELINES = [
  "Video should be 2–5 minutes.",
  "Project must use a MakersFlow kit.",
  "Only original work is accepted.",
  "Multiple submissions are allowed.",
  "Selected winners receive 20% cashback.",
  "Photos will only be displayed with permission.",
];

const PROCESS = [
  "Step 1 – Submit your project.",
  "Step 2 – MakersFlow team reviews entries.",
  "Step 3 – Evaluation (7–10 working days).",
  "Step 4 – Winners announced monthly.",
  "Step 5 – Selected innovators are featured on the Future Innovators Wall.",
];

const REPLACEMENT = [
  { title: "Damaged Kit", body: "Replacement in 2–3 days." },
  { title: "Wrong Kit", body: "Correct kit shipped in 1 day." },
  { title: "No Refunds", body: "Purchased kits are non-refundable." },
  { title: "Innovation Cashback", body: "Selected innovators receive 20% cashback." },
];

const FAQS = [
  { q: "Do I need previous experience?", a: "No. MakersFlow kits are designed for beginners." },
  {
    q: "Can school students participate?",
    a: "Yes, students from schools and colleges can participate.",
  },
  { q: "Can I submit multiple projects?", a: "Yes, multiple submissions are allowed." },
  { q: "Will I receive a certificate?", a: "Selected innovators receive a digital certificate." },
  {
    q: "Can I improve an existing MakersFlow project?",
    a: "Absolutely. Creativity and improvements are encouraged.",
  },
  {
    q: "How are winners selected?",
    a: "Based on creativity, usefulness, technical understanding, and presentation.",
  },
  {
    q: "Will my photo be displayed publicly?",
    a: "Only selected innovators who provide permission will be featured.",
  },
  { q: "How long does evaluation take?", a: "Usually 7–10 working days." },
  {
    q: "What if I don't win?",
    a: "Every project is reviewed and contributes to your innovation journey.",
  },
];

function InnovationChallengePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pt-28 pb-16 sm:pt-32">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -top-40 right-1/4 h-[40rem] w-[40rem] rounded-full bg-accent/20 opacity-40 blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 h-[35rem] w-[35rem] rounded-full bg-primary/20 opacity-30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            <Sparkles className="h-3.5 w-3.5" /> MakersFlow · 2026
          </p>

          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            🏆 MakersFlow <span className="text-primary">Innovation Challenge</span> 2026
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Have you built something unique using your MakersFlow kit? Turn your creativity into
            recognition by participating in the MakersFlow Innovation Challenge.
          </p>

          <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-border bg-card p-7 text-left">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <Gift className="h-5 w-5 text-accent" /> Why Participate?
            </h2>
            <ul className="space-y-2.5">
              {WHY_PARTICIPATE.map((w) => (
                <li key={w} className="flex items-start gap-2.5 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mx-auto mt-7 max-w-2xl text-muted-foreground">
            Simply build, improve, or creatively use your MakersFlow kit, record your innovation,
            and submit your project for evaluation. Selected innovators will receive rewards,
            recognition, and a chance to be featured on the Future Innovators Wall.
          </p>

          <a
            href="#submission"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-foreground transition hover:opacity-90"
          >
            🚀 Participate Now <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ── Banner ───────────────────────────────────────────────────────── */}
      <div className="bg-accent py-4 text-center font-semibold text-accent-foreground">
        🏆 Participate • Innovate • Get Rewarded • Get Recognized
      </div>

      {/* ── Future Innovators Wall ───────────────────────────────────────── */}
      <Section id="wall" muted>
        <SectionHeading
          eyebrow="Recognition"
          title="📸 Future Innovators Wall"
          description="Every month, selected innovators will have their photo, project, school/college name, and achievement displayed on the MakersFlow Future Innovators Wall."
        />

        <Grid cols={3}>
          {WALL.map((s) => (
            <Card key={s.project} className="text-center">
              <span className="mx-auto mb-4 grid h-28 w-28 place-items-center rounded-full border-4 border-accent bg-secondary text-muted-foreground">
                <Users className="h-10 w-10" />
              </span>
              <CardTitle>{s.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{s.project}</p>
            </Card>
          ))}
        </Grid>

        <Card accent className="mt-6 text-center">
          <CardTitle>🌟 Your Innovation Could Inspire Thousands</CardTitle>
          <p className="text-muted-foreground">
            Build, innovate, and share your ideas. Selected innovators will be featured on the
            Future Innovators Wall and inspire future creators across India.
          </p>
        </Card>
      </Section>

      {/* ── Challenge & rewards ──────────────────────────────────────────── */}
      <Section>
        <SectionHeading eyebrow="Programme" title="🏆 Innovation Challenge & Rewards" />
        <Grid cols={3}>
          {REWARDS.map((r) => (
            <Card key={r.title}>
              <CardTitle>{r.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{r.body}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* ── Submission ───────────────────────────────────────────────────── */}
      <Section id="submission" muted>
        <SectionHeading
          eyebrow="Entries open"
          title="📤 Submit Your Innovation"
          description="Winners announced in the first week of every month."
        />
        <SubmissionForm />

        <Card className="mx-auto mt-6 max-w-3xl">
          <CardTitle>Submission Guidelines</CardTitle>
          <ul className="mt-2 space-y-2">
            {GUIDELINES.map((g) => (
              <li key={g} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {g}
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      {/* ── Winner process ───────────────────────────────────────────────── */}
      <Section>
        <SectionHeading eyebrow="What happens next" title="⏳ Winner Announcement Process" />
        <div className="mx-auto max-w-3xl space-y-3">
          {PROCESS.map((step, i) => (
            <div
              key={step}
              className="flex items-center gap-4 rounded-2xl border border-border border-l-4 border-l-accent bg-card p-5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 font-bold text-accent">
                {i + 1}
              </span>
              <p className="text-foreground">{step}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Replacement policy ───────────────────────────────────────────── */}
      <Section muted>
        <SectionHeading eyebrow="Support" title="🛠 Replacement Policy" />
        <Grid cols={4}>
          {REPLACEMENT.map((r) => (
            <Card key={r.title}>
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <PackageCheck className="h-5 w-5" />
              </span>
              <CardTitle>{r.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{r.body}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section id="faq">
        <SectionHeading eyebrow="FAQ" title="❓ Frequently Asked Questions" />
        <FaqList items={FAQS} />
      </Section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <Section muted>
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-10 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">📞 Contact MakersFlow</h2>
          <div className="mt-4 space-y-1 text-muted-foreground">
            <p>Email: support@makersflow.in</p>
            <p>Website: www.makersflow.in</p>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          © 2026 MakersFlow Innovation Hub
        </p>
      </Section>

      <Footer />
    </main>
  );
}

// ─── Submission form ─────────────────────────────────────────────────────────

const MAX_VIDEO_MB = 50;
const MAX_IMAGE_MB = 5;
const MAX_IMAGES = 5;

const EMPTY_FORM = {
  full_name: "",
  age: "",
  institution: "",
  kit_name: "",
  project_title: "",
  description: "",
  problem_solved: "",
  inspiration: "",
  video_url: "",
  feature_consent: "",
};

function SubmissionForm() {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): string | null => {
    if (form.full_name.trim().length < 2) return "Enter your name";
    if (form.project_title.trim().length < 2) return "Enter your project title";
    if (form.description.trim().length < 10) return "Tell us a little about your project";

    const video = videoFiles[0];
    if (video && video.size > MAX_VIDEO_MB * 1024 * 1024) {
      return `That video is over ${MAX_VIDEO_MB} MB. Upload a smaller file, or paste a video link instead.`;
    }
    if (imageFiles.length > MAX_IMAGES) return `Please choose up to ${MAX_IMAGES} images`;
    if (imageFiles.some((f) => f.size > MAX_IMAGE_MB * 1024 * 1024)) {
      return `Each image must be under ${MAX_IMAGE_MB} MB`;
    }
    if (!video && !form.video_url.trim()) {
      return "Add a video file or paste a video link";
    }
    return null;
  };

  /**
   * Uploads one file via the NestJS presigned-URL flow and returns its
   * public S3 URL, or null if the upload failed.
   *
   * Backend: POST /challenges/media/upload-url
   * Response: { uploadUrl, key, publicUrl }  (wrapped in ApiResponse.data)
   * Allowed types: image/jpeg, image/png, image/webp, video/mp4, video/webm
   */
  const upload = async (file: File, _folder: string): Promise<string | null> => {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    const contentType = file.type;
    if (!ALLOWED.includes(contentType)) {
      console.warn('[challenge] unsupported content type:', contentType);
      toast.error(`Unsupported file type: ${contentType}. Use JPEG, PNG, WebP, MP4, or WebM.`);
      return null;
    }

    try {
      const res = await apiClient.post<{ uploadUrl: string; key: string; publicUrl: string }>(
        '/challenges/media/upload-url',
        { fileName: file.name, contentType },
      );
      const { uploadUrl, publicUrl } = res.data;

      // Upload directly to S3 — no Authorization header sent to S3
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': contentType },
      });

      if (!s3Res.ok) {
        console.warn('[challenge] S3 PUT failed:', s3Res.status);
        return null;
      }

      return publicUrl;
    } catch (err: any) {
      console.warn('[challenge] upload failed:', err?.message ?? err);
      return null;
    }
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(true);
    try {
      let videoUrl = form.video_url.trim() || null;

      if (videoFiles[0]) {
        setProgress("Uploading video…");
        const uploaded = await upload(videoFiles[0], "videos");
        if (!uploaded && !videoUrl) {
          toast.error("The video didn't upload. Paste a video link instead and try again.");
          setSaving(false);
          setProgress("");
          return;
        }
        videoUrl = uploaded ?? videoUrl;
      }

      const imageUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        setProgress(`Uploading image ${i + 1} of ${imageFiles.length}…`);
        const url = await upload(imageFiles[i], "images");
        if (url) imageUrls.push(url);
      }

      setProgress("Saving your entry…");
      try {
        await apiClient.post("/challenges/submissions", {
          full_name: form.full_name.trim(),
          age: form.age ? Number(form.age) : undefined,
          institution: form.institution.trim() || undefined,
          kit_name: form.kit_name.trim() || undefined,
          project_title: form.project_title.trim(),
          description: form.description.trim(),
          problem_solved: form.problem_solved.trim() || undefined,
          inspiration: form.inspiration.trim() || undefined,
          video_url: videoUrl || undefined,
          image_urls: imageUrls,
          feature_consent: form.feature_consent === "Yes",
        });
      } catch (err: any) {
        if (err?.status === 404) {
          toast.error("Submissions aren't set up yet. Please contact support@makersflow.in.");
        } else {
          toast.error(err?.data?.message ?? "Could not submit your entry");
        }
        return;
      }

      setDone(true);
      setForm({ ...EMPTY_FORM });
      setVideoFiles([]);
      setImageFiles([]);
      toast.success("Innovation submitted");
    } finally {
      setSaving(false);
      setProgress("");
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-primary/40 bg-primary/5 p-10 text-center">
        <Trophy className="mx-auto h-12 w-12 text-primary" />
        <h3 className="mt-4 font-display text-2xl font-bold text-foreground">Entry received</h3>
        <p className="mt-2 text-muted-foreground">
          Evaluation takes 7–10 working days. Winners are announced in the first week of every
          month.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-6 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary"
        >
          Submit another project
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 sm:p-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Name" value={form.full_name} onChange={set("full_name")} required />
        <TextField
          label="Age"
          type="number"
          value={form.age}
          onChange={set("age")}
          min={5}
          max={100}
        />
        <TextField
          label="School / College"
          value={form.institution}
          onChange={set("institution")}
        />
        <TextField label="Kit Name" value={form.kit_name} onChange={set("kit_name")} />

        <div className="sm:col-span-2">
          <TextField
            label="Project Title"
            value={form.project_title}
            onChange={set("project_title")}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            label="Description"
            value={form.description}
            onChange={set("description")}
            rows={4}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            label="What problem does your innovation solve?"
            value={form.problem_solved}
            onChange={set("problem_solved")}
            rows={3}
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            label="What inspired you to build this project?"
            value={form.inspiration}
            onChange={set("inspiration")}
            rows={3}
          />
        </div>

        <div className="sm:col-span-2">
          <FileField
            label="Upload Video"
            hint={`2–5 minutes, up to ${MAX_VIDEO_MB} MB. Larger file? Paste a link below instead.`}
            accept="video/*"
            files={videoFiles}
            onChange={(files) => setVideoFiles(files.slice(0, 1))}
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            label="…or paste a video link (YouTube, Drive, etc.)"
            value={form.video_url}
            onChange={set("video_url")}
            placeholder="https://"
          />
        </div>

        <div className="sm:col-span-2">
          <FileField
            label="Upload Images"
            hint={`Up to ${MAX_IMAGES} photos, ${MAX_IMAGE_MB} MB each.`}
            accept="image/*"
            multiple
            files={imageFiles}
            onChange={setImageFiles}
          />
        </div>

        <div className="sm:col-span-2">
          <SelectField
            label="Would you like to be featured on the Future Innovators Wall if selected?"
            value={form.feature_consent}
            onChange={set("feature_consent")}
            options={["Yes", "No"]}
            placeholder="Select an answer"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? progress || "Submitting…" : "🚀 Submit Innovation"}
      </button>

      <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <Camera className="h-3.5 w-3.5" />
        🏆 Winners announced in the first week of every month
      </p>
    </div>
  );
}
