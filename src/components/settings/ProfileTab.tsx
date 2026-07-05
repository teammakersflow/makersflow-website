import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function ProfileTab() {
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", bio: "",
    university: "", major: "", graduationYear: "",
  });
  const [original, setOriginal] = useState({ ...formData });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const meta = data.user.user_metadata ?? {};
      const email = data.user.email ?? "";
      const fullName = (meta.full_name ?? meta.name ?? "").split(" ");
      const initial = {
        firstName: fullName[0] ?? "",
        lastName: fullName.slice(1).join(" ") ?? "",
        email,
        phone: meta.phone ?? "",
        bio: meta.bio ?? "",
        university: meta.university ?? "",
        major: meta.major ?? "",
        graduationYear: meta.graduation_year ?? "",
      };
      setFormData(initial);
      setOriginal(initial);
    });
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(formData) !== JSON.stringify(original));
  }, [formData, original]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        bio: formData.bio,
        university: formData.university,
        major: formData.major,
        graduation_year: formData.graduationYear,
      }
    });
    setSaving(false);
    if (!error) {
      setOriginal({ ...formData });
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal details and academic information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value={formData.firstName}
              onChange={e => handleChange("firstName", e.target.value)}
              autoComplete="given-name" placeholder="First name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value={formData.lastName}
              onChange={e => handleChange("lastName", e.target.value)}
              autoComplete="family-name" placeholder="Last name" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email}
            autoComplete="email" readOnly
            className="bg-muted text-muted-foreground cursor-not-allowed"
            title="Email cannot be changed here" />
          <p className="text-xs text-muted-foreground">Email address is managed by your account settings</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" value={formData.phone}
            onChange={e => handleChange("phone", e.target.value)}
            autoComplete="tel" placeholder="+91 98765 43210" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={formData.bio}
            onChange={e => handleChange("bio", e.target.value)}
            placeholder="Tell us about yourself..." rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="university">School / University</Label>
            <Input id="university" value={formData.university}
              onChange={e => handleChange("university", e.target.value)}
              autoComplete="organization" placeholder="Your institution" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="major">Major / Stream</Label>
            <Input id="major" value={formData.major}
              onChange={e => handleChange("major", e.target.value)}
              placeholder="e.g. Computer Science" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="graduationYear">Graduation Year</Label>
          <Input id="graduationYear" value={formData.graduationYear}
            onChange={e => handleChange("graduationYear", e.target.value)}
            placeholder="e.g. 2026" maxLength={4} />
        </div>

        {saved && (
          <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-2 text-sm text-green-700">
            ✓ Profile updated successfully
          </div>
        )}

        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
