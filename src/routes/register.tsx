import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FloatingField } from "@/components/auth/FloatingField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLegalModal } from "@/components/auth/AuthLegalModal";
import { signUpWithPassword, signInWithGoogle } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create account — MakersFlow" },
      {
        name: "description",
        content:
          "Join MakersFlow to start learning Robotics, AI, Electronics, IoT and Programming with India's most exciting school.",
      },
    ],
  }),
  component: RegisterPage,
});

/**
 * Turn a Supabase auth error into something a user can act on.
 * The raw message is always kept as a suffix so support can diagnose.
 */
function mapSignUpError(error: { message?: string; status?: number }): string {
  const msg = (error?.message ?? "").toLowerCase();

  if (msg.includes("already registered") || msg.includes("already been registered")) {
    return "That email is already registered. Please sign in instead.";
  }
  if (msg.includes("database error")) {
    return "Server error while creating your profile. Please contact support \u2014 this is not a problem with your details.";
  }
  if (msg.includes("rate limit") || msg.includes("too many") || error?.status === 429) {
    return "Too many signup attempts. Please wait a few minutes and try again.";
  }
  if (msg.includes("password")) {
    return "Password does not meet the requirements. Use at least 8 characters.";
  }
  if (msg.includes("invalid") && msg.includes("email")) {
    return "That email address was rejected. Please check it and try again.";
  }
  if (msg.includes("confirmation") || msg.includes("smtp") || msg.includes("sending")) {
    return "Account created, but the confirmation email could not be sent. Please contact support.";
  }
  return error?.message
    ? `Could not create account: ${error.message}`
    : "Could not create account. Please try again.";
}

const grades = ["6", "7", "8", "9", "10", "11", "12", "12+"] as const;

const PWD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 8 characters",              test: (p) => p.length >= 8 },
  { label: "One lowercase letter",               test: (p) => /[a-z]/.test(p) },
  { label: "One uppercase letter",               test: (p) => /[A-Z]/.test(p) },
  { label: "One number",                         test: (p) => /[0-9]/.test(p) },
  { label: "One special character (!@#$%^&*…)",  test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordRequirements({ pwd }: { pwd: string }) {
  return (
    <ul className="mt-3 space-y-1.5 rounded-xl border border-border bg-secondary/30 px-4 py-3">
      {PWD_RULES.map(({ label, test }) => {
        const met = test(pwd);
        return (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2 text-[12px] font-medium transition-colors",
              met
                ? "text-emerald-500"
                : pwd
                  ? "text-red-400"
                  : "text-muted-foreground",
            )}
          >
            {met ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            {label}
          </li>
        );
      })}
    </ul>
  );
}

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .refine((p) => /[a-z]/.test(p), "Password must contain at least one lowercase letter")
    .refine((p) => /[A-Z]/.test(p), "Password must contain at least one uppercase letter")
    .refine((p) => /[0-9]/.test(p), "Password must contain at least one number")
    .refine((p) => /[^A-Za-z0-9]/.test(p), "Password must contain at least one special character"),
  grade: z.enum(grades, { message: "Select your class" }),
  school: z.string().trim().min(2, "Enter your school name").max(120),
});

type FormValues = z.infer<typeof schema>;

function RegisterPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [values, setValues] = useState<FormValues>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    grade: "" as FormValues["grade"],
    school: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const update =
    (k: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [k]: e.target.value as FormValues[typeof k] }));
      setErrors((er) => ({ ...er, [k]: "" }));
      setFormError(null);
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!agreed) {
      setTermsError("You must agree to the Terms of Service and Privacy Policy to continue");
      valid = false;
    }
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fe: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        fe[issue.path[0] as keyof FormValues] = issue.message;
      }
      setErrors(fe);
      valid = false;
    }
    if (!valid || !parsed.success) return;
    const formData = parsed.data;
    setLoading(true);
    const { data, error } = await signUpWithPassword(
      formData.email,
      formData.password,
      {
        full_name: formData.full_name,
        phone: formData.phone || null,
        grade: formData.grade,
        school: formData.school,
        role: "student",
      },
      redirect,
    );

    if (error) {
      console.error("[register] Sign up failed:", error);
      setLoading(false);
      // ── FIX ──────────────────────────────────────────────────────────────
      // Every failure used to show the same "already registered" text, which
      // hid the real cause — weak password, rate limit, a crashing DB trigger,
      // unconfigured SMTP. Map the common Supabase errors to something
      // actionable and fall back to the actual message.
      setFormError(mapSignUpError(error));
      return;
    }

    // Best-effort profile upsert (mirrors mobile app shape). RLS-safe:
    // only runs when session is created (auto-confirm on) — otherwise
    // a DB trigger should populate profiles on signup.
    if (data.user && data.session) {
      const profilePayload = {
        id: data.user.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        grade: formData.grade,
        school: formData.school,
        role: "student",
      };
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });
    }

    setLoading(false);

    if (data.session) {
      navigate({ to: redirect || "/dashboard" });
    } else {
      setSuccess(true);
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle(redirect);
    if (error) {
      console.error("[register] Google sign-in failed:", error);
      setFormError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      routeKey="register"
      title="Create your account"
      subtitle={
        <>
          Already have one?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FloatingField
          id="full_name"
          label="Full name"
          autoComplete="name"
          value={values.full_name}
          onChange={update("full_name")}
          error={errors.full_name}
        />
        <FloatingField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={update("email")}
          error={errors.email}
        />
        {/* Phone field with +91 prefix */}
        <div className="space-y-1.5">
          <div className="relative flex overflow-hidden rounded-xl border border-border bg-card transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
            <span className="flex shrink-0 items-center border-r border-border bg-secondary/50 px-3 text-sm font-semibold text-muted-foreground select-none">
              +91
            </span>
            <div className="relative flex-1">
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel-national"
                value={values.phone}
                onChange={update("phone")}
                placeholder=" "
                className="peer block w-full bg-transparent px-4 pb-2 pt-5 text-sm text-foreground outline-none"
              />
              <label
                htmlFor="phone"
                className="pointer-events-none absolute left-4 top-3 origin-left bg-card px-1 font-sans text-sm text-muted-foreground transition-all duration-150 peer-placeholder-shown:top-3 peer-placeholder-shown:scale-100 peer-focus:-top-0.5 peer-focus:scale-[0.82] peer-focus:text-primary peer-[:not(:placeholder-shown)]:-top-0.5 peer-[:not(:placeholder-shown)]:scale-[0.82]"
              >
                Mobile number
              </label>
            </div>
          </div>
          {errors.phone && (
            <p className="flex items-center gap-1.5 pl-1 text-xs font-medium text-destructive">
              {errors.phone}
            </p>
          )}
        </div>
        <FloatingField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={update("password")}
          error={errors.password}
        />
        <PasswordRequirements pwd={values.password} />
        <div className="grid grid-cols-2 gap-3">
          <FloatingField
            as="select"
            id="grade"
            label="Class"
            value={values.grade}
            onChange={update("grade")}
            error={errors.grade}
          >
            <option value="" disabled hidden></option>
            {grades.map((g) => (
              <option key={g} value={g}>
                Class {g}
              </option>
            ))}
          </FloatingField>
          <FloatingField
            id="school"
            label="School"
            value={values.school}
            onChange={update("school")}
            error={errors.school}
          />
        </div>

        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Account created. Check your email to confirm, then sign in.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terms & Privacy Checkbox */}
        <div className="space-y-1 pt-1">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="terms-agree"
              checked={agreed}
              onCheckedChange={(c) => {
                setAgreed(!!c);
                setTermsError(null);
              }}
              className="mt-0.5"
            />
            <label
              htmlFor="terms-agree"
              className="text-xs text-muted-foreground leading-snug cursor-pointer select-none"
            >
              I agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setLegalModal("terms");
                }}
                className="font-semibold text-foreground underline hover:text-primary transition-colors inline-block"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setLegalModal("privacy");
                }}
                className="font-semibold text-foreground underline hover:text-primary transition-colors inline-block"
              >
                Privacy Policy
              </button>
            </label>
          </div>
          {termsError && <p className="text-xs text-destructive">{termsError}</p>}
        </div>

        <SubmitButton loading={loading} loadingText="Creating account...">
          Create account
        </SubmitButton>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
              or
            </span>
          </div>
        </div>

        <GoogleButton onClick={onGoogle} disabled={googleLoading} label="Sign up with Google" />
      </form>

      <AuthLegalModal
        type={legalModal}
        onClose={() => setLegalModal(null)}
        onAgree={() => {
          setAgreed(true);
          setTermsError(null);
        }}
      />
    </AuthLayout>
  );
}
