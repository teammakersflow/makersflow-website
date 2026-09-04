import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Sparkles, User as UserIcon } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { getAvatarUrl } from "@/constants/avatars";
import { AvatarPickerModal } from "@/components/profile/AvatarPickerModal";
import { toast } from "sonner";

export function ProfileTab() {
  const { user, updateProfile, refreshUser } = useAuthContext();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    university: "",
    major: "",
    graduationYear: "",
  });
  const [original, setOriginal] = useState({ ...formData });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata ?? {};
    const email = user.email ?? "";
    const fullName = (user.full_name ?? meta.full_name ?? meta.name ?? "").split(" ");
    const initial = {
      firstName: fullName[0] ?? "",
      lastName: fullName.slice(1).join(" ") ?? "",
      email,
      phone: meta.phone ?? "",
      bio: meta.bio ?? "",
      university: (user.school ?? meta.university ?? meta.school ?? "") as string,
      major: (meta.major ?? "") as string,
      graduationYear: (user.grade ?? meta.graduation_year ?? meta.grade ?? "") as string,
    };
    setFormData(initial);
    setOriginal(initial);
  }, [user]);

  useEffect(() => {
    setHasChanges(JSON.stringify(formData) !== JSON.stringify(original));
  }, [formData, original]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const res = await updateProfile({
      full_name: fullName || undefined,
      school: formData.university || undefined,
      grade: formData.graduationYear || undefined,
      university: formData.university || undefined,
      major: formData.major || undefined,
      graduation_year: formData.graduationYear || undefined,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
    });
    setSaving(false);
    if (res.success) {
      setOriginal({ ...formData });
      setHasChanges(false);
      setSaved(true);
      toast.success("Profile updated successfully");
      await refreshUser();
      setTimeout(() => setSaved(false), 3000);
    } else {
      toast.error(res.error || "Could not update profile");
    }
  };

  const currentAvatarUrl = user?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;
  const resolvedAvatarUrl = getAvatarUrl(currentAvatarUrl) ?? currentAvatarUrl;
  const initials = ((formData.firstName || "")[0] || "") + ((formData.lastName || "")[0] || "");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details and academic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-border">
            <div className="relative">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-accent/20 ring-4 ring-background shadow-md">
                {resolvedAvatarUrl ? (
                  <img
                    src={resolvedAvatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : initials ? (
                  <div className="grid h-full w-full place-items-center font-display text-2xl font-bold text-primary">
                    {initials.toUpperCase()}
                  </div>
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground">
                    <UserIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-transform hover:scale-110 cursor-pointer"
                aria-label="Change profile photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-sm font-semibold text-foreground">Profile Avatar</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload a custom photo (JPEG, PNG, WEBP, GIF up to 5MB) or choose a character preset.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPickerOpen(true)}
                className="mt-2.5 h-8 gap-1.5 text-xs rounded-xl"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Change Avatar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                autoComplete="given-name"
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                autoComplete="family-name"
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              autoComplete="email"
              readOnly
              className="bg-muted text-muted-foreground cursor-not-allowed"
              title="Email cannot be changed here"
            />
            <p className="text-xs text-muted-foreground">
              Email address is managed by your account settings
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              autoComplete="tel"
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="university">School / University</Label>
              <Input
                id="university"
                value={formData.university}
                onChange={(e) => handleChange("university", e.target.value)}
                autoComplete="organization"
                placeholder="Your institution"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major / Stream</Label>
              <Input
                id="major"
                value={formData.major}
                onChange={(e) => handleChange("major", e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input
              id="graduationYear"
              value={formData.graduationYear}
              onChange={(e) => handleChange("graduationYear", e.target.value)}
              placeholder="e.g. 2026"
              maxLength={4}
            />
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

      <AvatarPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        currentAvatarUrl={currentAvatarUrl}
        onAvatarUpdated={async () => {
          await refreshUser();
        }}
      />
    </>
  );
}
