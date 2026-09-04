import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ExternalLink, CheckCircle2 } from "lucide-react";

export function SecurityTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Account authentication and security settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 max-w-lg">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Google OAuth Authentication</h4>
                <p className="text-xs text-muted-foreground">Your account is secured via Google Sign-In</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Passwords, two-step verification, and active login sessions for your MakersFlow account are securely managed by Google Account Security.
            </p>
            <div className="pt-1">
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Manage Google Account Security <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Single sign-on protection active via NestJS JWT</span>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-semibold text-foreground mb-1 text-sm">Security Best Practices</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Keep your Google account recovery options (phone and recovery email) up to date</li>
            <li>Enable 2-Step Verification on your Google account for enhanced security</li>
            <li>Never share your account tokens or session credentials with anyone</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
