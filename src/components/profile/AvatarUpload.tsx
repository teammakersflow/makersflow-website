import { useRef, useState } from "react";
import { Camera, Loader2, Upload, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadAvatar } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initials = (fullName ?? "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 5 MB");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    const res = await uploadAvatar(userId, file);
    setUploading(false);
    if (res.ok && res.url) {
      onUploaded(res.url);
      toast.success("Avatar updated");
    } else {
      setPreview(initialUrl);
      toast.error(res.error ?? "Could not upload avatar");
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-6 transition-colors sm:flex-row sm:items-center",
        dragOver ? "border-primary bg-primary/5" : "border-border bg-background",
      )}
    >
      <div className="relative">
        <div className="relative h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-accent/20 ring-4 ring-background">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
          ) : initials ? (
            <div className="grid h-full w-full place-items-center font-display text-3xl font-bold text-primary">
              {initials}
            </div>
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <UserIcon className="h-10 w-10" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-foreground/40 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-background" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-md ring-4 ring-background transition-transform hover:scale-110"
          aria-label="Change avatar"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 text-center sm:text-left">
        <h3 className="font-display text-base font-semibold text-foreground">Profile photo</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag &amp; drop an image here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-primary hover:underline"
          >
            browse files
          </button>
          . PNG or JPG, up to 5 MB.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload image
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
