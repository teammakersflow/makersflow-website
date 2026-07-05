import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Download,
  FileText,
  ListChecks,
  MessageSquare,
  Sparkles,
  X,
  ChevronRight,
  ScrollText,
} from "lucide-react";
import { type LessonDetail, type LessonResource } from "@/lib/learn-data";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabKey = "notes" | "transcript" | "resources" | "discussion" | "quiz";

export const TABS: {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "notes", label: "Notes", icon: FileText },
  { key: "transcript", label: "Transcript", icon: ScrollText },
  { key: "resources", label: "Resources", icon: Download },
  { key: "discussion", label: "Discussion", icon: MessageSquare },
  { key: "quiz", label: "Quiz", icon: ListChecks },
];

export function formatBytes(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ─── MarkCompleteButton ───────────────────────────────────────────────────────

export function MarkCompleteButton({
  isCompleted,
  onClick,
}: {
  isCompleted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isCompleted}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 font-display text-sm font-semibold transition-all",
        isCompleted
          ? "bg-success/15 text-success"
          : "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-glow-primary)] hover:scale-[1.03]",
      )}
    >
      {isCompleted ? (
        <>
          <CheckCircle2 className="h-4 w-4" /> Completed
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" /> Mark Complete
        </>
      )}
    </button>
  );
}

// ─── LessonTabBar ─────────────────────────────────────────────────────────────

export function LessonTabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors sm:px-5",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {t.label}
            {isActive && (
              <motion.span
                layoutId="lesson-tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-primary to-accent"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── NotesBlock ───────────────────────────────────────────────────────────────

export function NotesBlock({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);
  return (
    <div className="space-y-5 text-base leading-relaxed text-foreground">
      {blocks.map((b, i) => {
        if (b.startsWith("## "))
          return (
            <h2 key={i} className="font-display text-xl font-bold text-foreground">
              {b.replace(/^##\s+/, "")}
            </h2>
          );
        if (b.startsWith("# "))
          return (
            <h1 key={i} className="font-display text-2xl font-bold text-foreground">
              {b.replace(/^#\s+/, "")}
            </h1>
          );
        if (b.startsWith("> "))
          return (
            <blockquote
              key={i}
              className="rounded-xl border border-border/60 bg-muted/40 px-5 py-4 text-foreground/90 italic font-medium"
            >
              {b.replace(/^>\s+/, "")}
            </blockquote>
          );
        if (/^\s*-\s+/.test(b)) {
          const items = b.split(/\n/).map((l) => l.replace(/^\s*-\s+/, ""));
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 text-foreground/90">
              {items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-foreground/90">
            {b}
          </p>
        );
      })}
    </div>
  );
}

// ─── ResourcesList ────────────────────────────────────────────────────────────

export function ResourcesList({ resources }: { resources: LessonResource[] }) {
  return (
    <ul className="space-y-2">
      {resources.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{r.title}</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {r.type ?? "file"} {r.size_bytes ? `· ${formatBytes(r.size_bytes)}` : ""}
              </p>
            </div>
          </div>
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </li>
      ))}
    </ul>
  );
}

// ─── ComingSoonPanel ──────────────────────────────────────────────────────────

export function ComingSoonPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-display text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// ─── LessonTabPanel ───────────────────────────────────────────────────────────

export function LessonTabPanel({
  tab,
  lesson,
  resources,
}: {
  tab: TabKey;
  lesson: LessonDetail;
  resources: LessonResource[];
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        {tab === "notes" && (
          <article className="prose prose-sm max-w-none rounded-2xl border border-border bg-card p-5 sm:p-6">
            <NotesBlock content={lesson.notes ?? "_No notes for this lesson yet._"} />
          </article>
        )}
        {tab === "transcript" && (
          <article className="prose prose-sm max-w-none rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Auto-generated Transcript
            </p>
            <NotesBlock content={lesson.notes ?? "_No transcript available for this lesson._"} />
          </article>
        )}
        {tab === "resources" && <ResourcesList resources={resources} />}
        {tab === "discussion" && (
          <ComingSoonPanel
            icon={MessageSquare}
            title="Discussion is coming soon"
            description="Ask questions and connect with classmates. We're rolling this out shortly."
          />
        )}
        {tab === "quiz" && (
          <ComingSoonPanel
            icon={ListChecks}
            title="Quiz coming next"
            description="Test what you learned in this lesson with a short quiz."
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── AutoAdvanceToast ─────────────────────────────────────────────────────────

export function AutoAdvanceToast({
  secondsLeft,
  onCancel,
}: {
  secondsLeft: number;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2"
    >
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-elegant)]">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-white">
          <ChevronRight className="h-4 w-4" />
        </span>
        <div>
          <p className="font-display text-sm font-semibold text-foreground">
            Next lesson in {secondsLeft}…
          </p>
          <p className="text-xs text-muted-foreground">Auto-advancing — stop to stay here.</p>
        </div>
        <button
          onClick={onCancel}
          className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
      </div>
    </motion.div>
  );
}
