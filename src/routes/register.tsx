import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FloatingField } from "@/components/auth/FloatingField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { GoogleButton } from "@/components/auth/GoogleButton";
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

const grades = ["6", "7", "8", "9", "10", "11", "12"] as const;

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
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
    password: "",
    grade: "" as FormValues["grade"],
    school: "",
  });
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
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fe: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        fe[issue.path[0] as keyof FormValues] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setLoading(true);
    const { data, error } = await signUpWithPassword(
      parsed.data.email,
      parsed.data.password,
      {
        full_name: parsed.data.full_name,
        grade: parsed.data.grade,
        school: parsed.data.school,
        role: "student",
      },
      redirect,
    );

    if (error) {
      setLoading(false);
      setFormError(error.message);
      return;
    }

    // Best-effort profile upsert (mirrors mobile app shape). RLS-safe:
    // only runs when session is created (auto-confirm on) — otherwise
    // a DB trigger should populate profiles on signup.
    if (data.user && data.session) {
      const profilePayload = {
        id: data.user.id,
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        grade: parsed.data.grade,
        school: parsed.data.school,
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
      setFormError(error.message);
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
        <FloatingField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={update("password")}
          error={errors.password}
        />
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

        <SubmitButton loading={loading} loadingText="Creating account...">
          Create account
        </SubmitButton>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link to="/terms" className="font-medium underline hover:text-primary transition-colors">
            Terms
          </Link>{" "}
          &{" "}
          <Link
            to="/privacy"
            className="font-medium underline hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>

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
    </AuthLayout>
  );
}
