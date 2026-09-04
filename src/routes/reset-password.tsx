import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ExternalLink, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Account Security & Recovery — MakersFlow" },
      {
        name: "description",
        content: "Account security and recovery information for MakersFlow learners.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  return (
    <AuthLayout
      routeKey="reset-password"
      title="Account Recovery"
      subtitle="Password and security management for MakersFlow"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Managed via Google Account</h3>
              <p className="text-xs text-muted-foreground">Single sign-on active</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            MakersFlow accounts use Google Sign-In. Passwords, two-step verification, and account
            recovery links are securely handled by your linked Google Account.
          </p>
          <div className="pt-1">
            <a
              href="https://myaccount.google.com/signinoptions/password"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Change password on Google <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <Link
          to="/login"
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-light px-6 font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-all hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
