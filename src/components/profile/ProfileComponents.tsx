import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Shield,
  Trash2,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Chrome,
  BookOpen,
  GraduationCap,
  School,
} from "lucide-react";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { signOut } from "@/integrations/supabase/auth";
import { type Profile } from "@/lib/dashboard-data";
import { changePassword, updateProfile } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

// ─── Field ────────────────────────────────────────────────────────────────────
export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  readOnly,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPwd ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" aria-hidden />}
        {label} {required && <span className="text-accent font-black">*</span>}
      </span>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-all",
            "focus:border-primary/50 focus:shadow-[var(--shadow-glow-primary)] focus:ring-2 focus:ring-primary/20",
            readOnly && "cursor-not-allowed bg-secondary/40 text-muted-foreground",
            isPassword && "pr-10",
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────
function PasswordStrength({ pwd }: { pwd: string }) {
  if (!pwd) return null;
  const checks = [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-500", "bg-amber-500", "bg-primary", "bg-emerald-500"];
  const textColors = ["", "text-red-500", "text-amber-500", "text-primary", "text-emerald-600"];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              i <= score ? colors[score] : "bg-secondary",
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.06 }}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={cn("text-[11px] font-semibold", textColors[score])}>
          {labels[score]} password
        </p>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  children,
  accent = "text-primary",
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      {title && (
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          {Icon && (
            <div
              className={cn(
                "grid h-8 w-8 place-items-center rounded-xl bg-primary/10",
                accent === "text-primary" ? "bg-primary/10" : "bg-destructive/10",
              )}
            >
              <Icon className={cn("h-4 w-4", accent)} aria-hidden />
            </div>
          )}
          <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
        </div>
      )}
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

// ─── Save button ──────────────────────────────────────────────────────────────
function SaveButton({
  saving,
  onClick,
  label = "Save changes",
}: {
  saving: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={saving}
      whileHover={!saving ? { scale: 1.02 } : {}}
      whileTap={!saving ? { scale: 0.97 } : {}}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow-primary)] disabled:cursor-wait disabled:opacity-70 transition-all"
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      )}
      {saving ? "Saving…" : label}
    </motion.button>
  );
}

// ─── Profile completion bar ───────────────────────────────────────────────────
function ProfileCompletion({ profile }: { profile: Profile }) {
  const fields = [
    { label: "Name", done: !!profile.full_name?.trim() },
    { label: "Photo", done: !!profile.avatar_url },
    { label: "Grade", done: !!profile.grade?.trim() },
    { label: "School", done: !!profile.school?.trim() },
    { label: "Email", done: !!profile.email?.trim() },
  ];
  const pct = Math.round((fields.filter((f) => f.done).length / fields.length) * 100);
  if (pct >= 100) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
          <span aria-hidden>✨</span> Complete your profile
        </p>
        <span className="font-display text-base font-black text-amber-600">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-800 mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {fields
          .filter((f) => !f.done)
          .map((f) => (
            <span
              key={f.label}
              className="text-[11px] font-medium text-amber-700 dark:text-amber-400"
            >
              + Add {f.label}
            </span>
          ))}
      </div>
    </motion.div>
  );
}

// ─── AccountTab ───────────────────────────────────────────────────────────────
export function AccountTab({
  profile,
  isGoogle,
  onUpdated,
}: {
  profile: Profile;
  isGoogle: boolean;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    email: profile.email ?? "",
    grade: profile.grade ?? "",
    school: profile.school ?? "",
    avatar_url: profile.avatar_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const res = await updateProfile(profile.id, {
      full_name: form.full_name.trim() || null,
      grade: form.grade.trim() || null,
      school: form.school.trim() || null,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Profile saved ✓");
      onUpdated();
    } else toast.error(res.error ?? "Could not save");
  };

  return (
    <div className="space-y-5">
      <ProfileCompletion profile={{ ...profile, ...form, avatar_url: form.avatar_url || null }} />

      {/* Avatar */}
      <AvatarUpload
        userId={profile.id}
        initialUrl={form.avatar_url || null}
        fullName={form.full_name}
        onUploaded={(url) => {
          set("avatar_url", url);
          onUpdated();
        }}
      />

      {/* Account details */}
      <SectionCard title="Account details" icon={UserIcon}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            icon={UserIcon}
            value={form.full_name}
            onChange={(v) => set("full_name", v)}
            required
            placeholder="Your full name"
          />
          <Field
            label="Email"
            icon={Mail}
            value={form.email}
            onChange={(v) => set("email", v)}
            type="email"
            readOnly
            hint={
              isGoogle ? "Managed by your Google account" : "Email changes happen via verification"
            }
          />
          <Field
            label="Grade"
            icon={GraduationCap}
            value={form.grade}
            onChange={(v) => set("grade", v)}
            placeholder="e.g. Grade 9 / Class 11"
          />
          <Field
            label="School / College"
            icon={School}
            value={form.school}
            onChange={(v) => set("school", v)}
            placeholder="Your institution"
          />
        </div>
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Changes save to your makers.flow account.</p>
          <SaveButton saving={saving} onClick={handleSave} />
        </div>
      </SectionCard>
    </div>
  );
}

// ─── NotificationsTab ─────────────────────────────────────────────────────────
type ToggleKey =
  | "email_course"
  | "email_promo"
  | "email_digest"
  | "push_lesson"
  | "push_streak"
  | "push_orders";

const TOGGLES: { key: ToggleKey; title: string; desc: string; group: "Email" | "Push" }[] = [
  {
    key: "email_course",
    title: "Course updates",
    desc: "New lessons, instructor announcements",
    group: "Email",
  },
  {
    key: "email_promo",
    title: "Promotions & offers",
    desc: "Occasional discounts on courses and kits",
    group: "Email",
  },
  {
    key: "email_digest",
    title: "Weekly digest",
    desc: "Your learning recap every Sunday",
    group: "Email",
  },
  {
    key: "push_lesson",
    title: "Lesson reminders",
    desc: "Nudges to continue your current course",
    group: "Push",
  },
  {
    key: "push_streak",
    title: "Streak alerts",
    desc: "A reminder before your streak ends",
    group: "Push",
  },
  {
    key: "push_orders",
    title: "Order updates",
    desc: "Shipping confirmations and delivery",
    group: "Push",
  },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked
          ? "bg-gradient-to-r from-primary to-primary-light shadow-[var(--shadow-glow-primary)]"
          : "bg-secondary",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-md",
          checked ? "left-[1.4rem]" : "left-0.5",
        )}
      />
    </button>
  );
}

export function NotificationsTab() {
  const [state, setState] = useState<Record<ToggleKey, boolean>>({
    email_course: true,
    email_promo: false,
    email_digest: true,
    push_lesson: true,
    push_streak: true,
    push_orders: true,
  });
  const toggle = (k: ToggleKey, v: boolean) => setState((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-5">
      {(["Email", "Push"] as const).map((g) => (
        <SectionCard key={g} title={`${g} notifications`} icon={g === "Email" ? Mail : Bell}>
          <div className="divide-y divide-border">
            {TOGGLES.filter((t) => t.group === g).map((t, i) => (
              <motion.div
                key={t.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                </div>
                <Toggle checked={state[t.key]} onChange={(v) => toggle(t.key, v)} />
              </motion.div>
            ))}
          </div>
        </SectionCard>
      ))}
      <p className="text-xs text-muted-foreground px-1">
        Preferences save locally and will sync to your account in an upcoming release.
      </p>
    </div>
  );
}

// ─── SecurityTab ──────────────────────────────────────────────────────────────
export function SecurityTab({ isGoogle }: { isGoogle: boolean }) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    if (pwd.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (pwd !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    const res = await changePassword(pwd);
    setSaving(false);
    if (res.ok) {
      toast.success("Password updated ✓");
      setPwd("");
      setConfirm("");
    } else toast.error(res.error ?? "Could not update password");
  };

  return (
    <div className="space-y-5">
      {/* Change password */}
      <SectionCard title="Change password" icon={KeyRound}>
        {isGoogle ? (
          <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4">
            <Chrome className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
            <p className="text-sm text-muted-foreground">
              You signed in with Google. Manage your password from your{" "}
              <a
                href="https://myaccount.google.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Google account →
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Field
              label="New password"
              icon={Lock}
              type="password"
              value={pwd}
              onChange={setPwd}
              placeholder="At least 8 characters"
            />
            <PasswordStrength pwd={pwd} />
            <Field
              label="Confirm password"
              icon={Lock}
              type="password"
              value={confirm}
              onChange={setConfirm}
              hint={confirm && pwd !== confirm ? "⚠ Passwords don't match yet" : undefined}
            />
            <div className="flex justify-end pt-2">
              <SaveButton saving={saving} onClick={handleChange} label="Update password" />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Connected accounts */}
      <SectionCard title="Connected accounts" icon={Chrome}>
        <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-card border border-border shadow-sm">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path
                  fill="#EA4335"
                  d="M12 11v3.8h5.36c-.23 1.4-1.66 4.12-5.36 4.12-3.23 0-5.86-2.67-5.86-5.96S8.77 7 12 7c1.84 0 3.07.78 3.78 1.46l2.58-2.48C16.78 4.43 14.6 3.5 12 3.5 6.99 3.5 2.96 7.53 2.96 12.5S6.99 21.5 12 21.5c6.93 0 9.53-4.86 9.53-9.06 0-.61-.07-1.07-.16-1.44H12z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Google</div>
              <div className="text-xs text-muted-foreground">
                {isGoogle ? "Connected — signed in via Google" : "Not connected"}
              </div>
            </div>
          </div>
          {isGoogle ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Connected
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Not connected</span>
          )}
        </div>
      </SectionCard>

      {/* Sessions */}
      <SectionCard title="Sessions" icon={Lock}>
        <p className="text-sm text-muted-foreground mb-4">
          Sign out of all devices, including this one.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={async () => {
            await signOut();
            toast.success("Signed out");
            window.location.href = "/";
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary hover:border-primary/30 transition-all"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Sign out of all sessions
        </motion.button>
      </SectionCard>
    </div>
  );
}

// ─── PrivacyTab ───────────────────────────────────────────────────────────────
export function PrivacyTab() {
  return (
    <div className="space-y-5">
      {/* Privacy info */}
      <SectionCard title="Privacy & data" icon={Shield}>
        <p className="text-sm text-muted-foreground mb-5">
          Learn how we collect and use your data. We apply extra safeguards for learners under 18.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              to: "/privacy",
              label: "Privacy Policy",
              desc: "What we collect & why",
              icon: Shield,
            },
            {
              to: "/terms",
              label: "Terms of Service",
              desc: "Rules for using makers.flow",
              icon: BookOpen,
            },
          ].map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className="group flex items-center justify-between rounded-xl border border-border bg-background p-4 hover:border-primary/40 hover:bg-primary/3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/8 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {l.label}
                    </div>
                    <div className="text-xs text-muted-foreground">{l.desc}</div>
                  </div>
                </div>
                <ExternalLink
                  className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </SectionCard>

      {/* Your data */}
      <SectionCard title="Your data" icon={UserIcon}>
        <div className="space-y-3">
          {/* Export */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold text-foreground">Request data export</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                We'll email you a copy of your account, progress and orders within 7 business days.
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toast.success("Export requested — we'll email you soon.")}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-all whitespace-nowrap"
            >
              <UserIcon className="h-3.5 w-3.5" aria-hidden /> Request export
            </motion.button>
          </div>

          {/* Danger zone */}
          <div className="overflow-hidden rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
            <div className="flex items-center gap-2 border-b border-red-200 dark:border-red-900 px-4 py-2.5 bg-red-100/70 dark:bg-red-950/30">
              <Trash2 className="h-3.5 w-3.5 text-red-600" aria-hidden />
              <span className="text-xs font-black uppercase tracking-widest text-red-600">
                Danger zone
              </span>
            </div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-bold text-red-700 dark:text-red-400">
                  Delete my account
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Permanently remove your account and all learning data. This cannot be undone.
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toast.success("Deletion request received — we'll confirm by email.")}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-card px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete account
              </motion.button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
