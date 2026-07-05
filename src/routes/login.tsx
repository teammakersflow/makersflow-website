import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FloatingField } from "@/components/auth/FloatingField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { signInWithPassword, signInWithGoogle } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — MakersFlow" },
      {
        name: "description",
        content:
          "Sign in to MakersFlow to continue learning Robotics, AI, Electronics, IoT and Programming.",
      },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const update = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
    setFormError(null);
  };

  const isEmailValid = z.string().email().safeParse(values.email).success;
  const isPasswordValid = values.password.length >= 6;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fe[issue.path[0] as string] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setLoading(true);
    const { error } = await signInWithPassword(parsed.data.email, parsed.data.password);
    setLoading(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    navigate({ to: redirect || "/dashboard" });
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle(redirect);
    if (error) {
      setFormError(error.message);
      setGoogleLoading(false);
    }
  };

  const onForgot = async () => {
    setFormError(null);
    if (!values.email || !z.string().email().safeParse(values.email).success) {
      setErrors((er) => ({ ...er, email: "Enter your email to reset password" }));
      return;
    }
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo,
    });
    if (error) setFormError(error.message);
    else setResetSent(true);
  };

  return (
    <AuthLayout
      routeKey="login"
      title="Welcome back"
      subtitle={
        <>
          New to MakersFlow?{" "}
          <Link
            to="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FloatingField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={update("email")}
          error={errors.email}
          valid={isEmailValid}
        />
        <FloatingField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={update("password")}
          error={errors.password}
          valid={isPasswordValid}
        />

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onForgot}
            className="font-medium text-primary hover:underline"
          >
            Forgot password?
          </button>
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
          {resetSent && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Password reset link sent. Check your inbox.</span>
            </motion.div>
          )}
        </AnimatePresence>

        <SubmitButton loading={loading} loadingText="Signing in...">
          Sign in
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

        <GoogleButton onClick={onGoogle} disabled={googleLoading} />
      </form>
    </AuthLayout>
  );
}
