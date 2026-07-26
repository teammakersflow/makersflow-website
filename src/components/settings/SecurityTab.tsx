import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    if (!newPass) {
      setMsg({ type: "error", text: "Please enter a new password" });
      return;
    }
    if (newPass.length < 6) {
      setMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    if (newPass !== confirm) {
      setMsg({ type: "error", text: "Passwords do not match" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSaving(false);

    if (error) {
      console.error("[SecurityTab] Password update failed:", error);
      setMsg({ type: "error", text: "Could not update password. Please try again." });
    } else {
      setMsg({ type: "success", text: "Password updated successfully!" });
      setCurrent("");
      setNewPass("");
      setConfirm("");
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Update your password to keep your account secure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
              name="new-password"
              placeholder="Enter new password (min 6 chars)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              name="confirm-password"
              placeholder="Confirm your new password"
            />
          </div>

          {msg && (
            <div
              className={`rounded-lg px-4 py-2.5 text-sm ${
                msg.type === "success"
                  ? "bg-green-50 border border-green-100 text-green-700"
                  : "bg-red-50 border border-red-100 text-red-700"
              }`}
            >
              {msg.text}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving || !newPass || !confirm}>
            {saving ? "Updating..." : "Update Password"}
          </Button>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-semibold text-foreground mb-1">Security Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Use at least 8 characters with a mix of letters, numbers and symbols</li>
            <li>Don't reuse passwords from other sites</li>
            <li>Enable two-factor authentication when available</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
