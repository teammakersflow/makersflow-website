import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FloatingField } from "@/components/auth/FloatingField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { AuthLegalModal } from "@/components/auth/AuthLegalModal";
import { useAuthContext } from "@/context/AuthContext";
import { resendConfirmationEmail } from "@/integrations/supabase/auth";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

/** Map a sign-in error to an actionable message. */
function mapSignInError(error: { message?: string; status?: number }): string {
  const msg = (error?.message ?? "").toLowerCase();

  if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
    return "Please confirm your email first \u2014 check your inbox (and spam) for the verification link. Use \u201cResend confirmation\u201d below if it never arrived.";
  }
  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (msg.includes("rate limit") || msg.includes("too many") || error?.status === 429) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (msg.includes("user not found")) {
    return "No account found with that email. Please register first.";
  }
  return error?.message
    ? `Sign-in notice: ${error.message}`
    : "Sign-in failed. Please sign in with Google.";
}

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
  const { loginWithGoogle, login } = useAuthContext();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(null);

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
const result = await login(parsed.data.email, parsed.data.password);
setLoading(false);
if (!result.success) {
  console.error("[login] Password sign-in failed:", result.error);
  setFormError(mapSignInError({ message: result.error }));
  return;
}
navigate({ to: redirect || "/dashboard" });
  };

  const onGoogleSuccess = async (idToken: string) => {
    setGoogleLoading(true);
    setFormError(null);
    const res = await loginWithGoogle(idToken);
    setGoogleLoading(false);
    if (!res.success) {
      setFormError(res.error || "Google Sign-In failed. Please try again.");
      return;
    }
    navigate({ to: redirect || "/dashboard" });
  };

  const onGoogleError = (err?: string) => {
    setFormError(err || "Google sign-in was cancelled or failed. Please try again.");
  };

  const onResendConfirmation = async () => {
    setFormError(null);
    if (!values.email || !z.string().email().safeParse(values.email).success) {
      setErrors((er) => ({ ...er, email: "Enter your email to resend confirmation" }));
      return;
    }
    const { error } = await resendConfirmationEmail(values.email);
    if (error) {
      setFormError(mapSignInError(error));
    } else {
      setResetSent(true);
    }
  };

  const onForgot = async () => {
    setFormError(null);
    setFormError("Password recovery is managed via Google Account security for Google sign-in.");
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
        <GoogleButton
          onSuccess={onGoogleSuccess}
          onError={onGoogleError}
          disabled={googleLoading}
        />

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
              or sign in with email
            </span>
          </div>
        </div>

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
          <button
            type="button"
            onClick={onResendConfirmation}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            Resend confirmation
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

        <div className="pt-2 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
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
        </div>
      </form>

      <AuthLegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </AuthLayout>
  );
}
