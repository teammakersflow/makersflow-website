import { useState, useRef, ChangeEvent, DragEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, X, UploadCloud, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PRESET_AVATARS, type PresetAvatar } from "@/constants/avatars";
import { updateProfile } from "@/lib/profile-data";
import { avatarStorageService, validateAvatarFile } from "@/lib/auth/avatarStorageService";
import { cn } from "@/lib/utils";

interface AvatarPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  currentAvatarUrl: string | null;
  onAvatarUpdated: (url: string) => void;
}

type ModalTab = "presets" | "upload";

export function AvatarPickerModal({
  open,
  onOpenChange,
  userId,
  currentAvatarUrl,
  onAvatarUpdated,
}: AvatarPickerModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>("presets");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(currentAvatarUrl);
  const [savingPreset, setSavingPreset] = useState(false);

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPreset = (preset: PresetAvatar) => {
    setSelectedPresetId(preset.id);
  };

  const handleConfirmPreset = async () => {
    if (!selectedPresetId) {
      onOpenChange(false);
      return;
    }

    setSavingPreset(true);
    // Persist preset avatar through NestJS backend PATCH /users/profile
    const res = await updateProfile({ avatar_url: selectedPresetId });
    setSavingPreset(false);

    if (res.ok) {
      onAvatarUpdated(selectedPresetId);
      toast.success("Avatar updated successfully!");
      onOpenChange(false);
    } else {
      toast.error(res.error ?? "Failed to update avatar");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format & size before upload
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUploadCustomAvatar = async () => {
    if (!selectedFile) {
      toast.error("Please select an image file first.");
      return;
    }

    setUploading(true);
    try {
      // 1. Validates format and size (< 5MB)
      // 2. Calls POST /storage/upload-url
      // 3. Uploads raw binary to S3 via PUT (NO Authorization header)
      // 4. Updates profile via PATCH /users/profile
      // 5. Returns publicUrl
      const result = await avatarStorageService.uploadAvatar(selectedFile);
      toast.success("Avatar uploaded and updated successfully! ✨");
      onAvatarUpdated(result.publicUrl);
      onOpenChange(false);
      // Reset upload state
      setSelectedFile(null);
      setFilePreview(null);
    } catch (err: unknown) {
      console.error("[AvatarPickerModal] Upload error:", err);
      const message = err instanceof Error ? err.message : "Failed to upload avatar.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading || savingPreset) return;
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 max-h-[88vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <Dialog.Title className="font-display text-lg font-bold text-foreground">
                Profile Avatar
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                Choose a character illustration or upload your own photo
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={uploading || savingPreset}
              className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab("presets")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer",
                activeTab === "presets"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Preset Characters
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer",
                activeTab === "upload"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Upload Photo
            </button>
          </div>

          {/* Tab 1: Presets Catalog */}
          {activeTab === "presets" && (
            <>
              <div className="flex-1 overflow-y-auto py-4 px-1">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {PRESET_AVATARS.map((avatar) => {
                    const isSelected =
                      selectedPresetId === avatar.id || selectedPresetId === avatar.url;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => handleSelectPreset(avatar)}
                        className="flex flex-col items-center group cursor-pointer"
                      >
                        <div
                          className={cn(
                            "relative h-20 w-20 rounded-full p-1 border-2 transition-all group-hover:scale-105",
                            isSelected
                              ? "border-primary ring-4 ring-primary/20 bg-primary/10"
                              : "border-border hover:border-primary/50 bg-secondary/40",
                          )}
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                        <span
                          className={cn(
                            "mt-1.5 text-xs font-semibold text-center truncate max-w-[80px]",
                            isSelected
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {avatar.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={savingPreset}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPreset}
                  disabled={savingPreset || !selectedPresetId}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {savingPreset ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Confirm Selection"
                  )}
                </button>
              </div>
            </>
          )}

          {/* Tab 2: Custom Image Upload */}
          {activeTab === "upload" && (
            <div className="flex-1 flex flex-col justify-between pt-4 overflow-y-auto">
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-file-input"
                />

                {filePreview ? (
                  <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-border bg-secondary/20">
                    <div className="relative h-28 w-28 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-md">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[240px]">
                        {selectedFile?.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-xs text-destructive hover:underline cursor-pointer"
                    >
                      Choose a different photo
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center",
                      dragOver
                        ? "border-primary bg-primary/10 scale-[1.01]"
                        : "border-border hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40",
                    )}
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-3">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      Click to select or drag & drop an image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPEG, PNG, WEBP, or GIF (max 5 MB)
                    </p>
                  </div>
                )}

                <div className="rounded-xl bg-muted/50 p-3 text-[11px] text-muted-foreground space-y-1">
                  <p>• Images will be stored securely and optimized for your profile.</p>
                  <p>• Presigned cloud uploads transmit directly without storing credentials.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={uploading}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadCustomAvatar}
                  disabled={uploading || !selectedFile}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading to Cloud...
                    </>
                  ) : (
                    "Upload & Save"
                  )}
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
