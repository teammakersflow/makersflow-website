
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { apiClient } from "@/lib/auth/apiClient";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — MakersFlow" },
      {
        name: "description",
        content: "Reset your MakersFlow account password.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch() as { token?: string };

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await apiClient.post(
        "/auth/reset-password",
        { token, newPassword: password },
        { skipAuth: true },
      );

      setSuccess("Your MakersFlow password has been reset. You can now sign in.");
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : "Unable to reset your password. The link may have expired.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      routeKey="reset-password"
      title="Reset Your Password"
      subtitle="Choose a new password for your MakersFlow account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              MakersFlow Password Recovery
            </h3>
            <p className="text-xs text-muted-foreground">
              Set a new password for email sign-in.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter the password again"
            className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {success && (
          <div
            role="status"
            className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-foreground"
          >
            <p className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" />
              Password reset successful
            </p>
            <p className="mt-1">{success}</p>
            <Link
              to="/login"
              className="mt-3 inline-block font-semibold text-primary hover:underline"
            >
              Continue to sign in
            </Link>
          </div>
        )}

        {!success && (
          <button
            type="submit"
            disabled={loading}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-light px-6 font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Resetting password..." : "Reset password"}
          </button>
        )}

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
