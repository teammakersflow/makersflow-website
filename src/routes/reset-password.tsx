import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FloatingField } from "@/components/auth/FloatingField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — MakersFlow" },
      {
        name: "description",
        content: "Set a new password for your MakersFlow account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [isRecoveryValid, setIsRecoveryValid] = useState(false);

  useEffect(() => {
    // Listen for recovery session established via magic link hash
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsRecoveryValid(true);
      }
      setSessionChecking(false);
    });

    // Check existing session state immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsRecoveryValid(true);
      }
      setSessionChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const update = (k: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
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
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setLoading(false);

    if (error) {
      console.error("[reset-password] Password update failed:", error);
      setFormError("Could not update password. Please request a new reset link.");
      return;
    }

    setSuccess(true);
  };

  if (sessionChecking) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!isRecoveryValid && !success) {
    return (
      <AuthLayout
        routeKey="reset-password-invalid"
        title="Invalid recovery link"
        subtitle="This password recovery link has expired or is invalid."
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Reset Link Expired</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Password recovery links can only be used once. Please request a new link from the
                sign-in page.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-primary-light px-6 font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-all hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] active:scale-[0.97]"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      routeKey="reset-password"
      title="Set new password"
      subtitle="Choose a strong password with at least 8 characters."
    >
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Password updated successfully! 🎉</p>
              <p className="mt-1 text-xs opacity-90">
                Your password has been changed. You can now sign in with your new credentials.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/login" })}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-light px-6 font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-all hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] active:scale-[0.97]"
          >
            <KeyRound className="h-4 w-4" />
            Sign in now
          </button>
        </motion.div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FloatingField
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={update("password")}
            error={errors.password}
          />
          <FloatingField
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={update("confirmPassword")}
            error={errors.confirmPassword}
          />

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
          </AnimatePresence>

          <SubmitButton loading={loading} loadingText="Updating password...">
            Update password
          </SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
