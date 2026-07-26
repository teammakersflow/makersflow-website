import { useState } from "react";
import { Camera, Sparkles, User as UserIcon } from "lucide-react";
import { getAvatarUrl } from "@/constants/avatars";
import { AvatarPickerModal } from "@/components/profile/AvatarPickerModal";

export function AvatarUpload({
  userId,
  initialUrl,
  fullName,
  onUploaded,
}: {
  userId: string;
  initialUrl: string | null;
  fullName: string | null;
  onUploaded: (url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [pickerOpen, setPickerOpen] = useState(false);

  const resolvedAvatarUrl = getAvatarUrl(preview) ?? preview;

  const initials = (fullName ?? "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 transition-colors sm:flex-row sm:items-center">
        <div className="relative">
          <div className="relative h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-accent/20 ring-4 ring-background">
            {resolvedAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolvedAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : initials ? (
              <div className="grid h-full w-full place-items-center font-display text-3xl font-bold text-primary">
                {initials}
              </div>
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <UserIcon className="h-10 w-10" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-md ring-4 ring-background transition-transform hover:scale-110 cursor-pointer"
            aria-label="Choose character avatar"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-display text-base font-semibold text-foreground">Profile Avatar</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a character illustration from our preset avatar catalog.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Choose Avatar
            </button>
          </div>
        </div>
      </div>

      <AvatarPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        userId={userId}
        currentAvatarUrl={preview}
        onAvatarUpdated={(newUrl) => {
          setPreview(newUrl);
          onUploaded(newUrl);
        }}
      />
    </>
  );
}

