import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { PRESET_AVATARS, type PresetAvatar } from "@/constants/avatars";
import { updateProfile } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

interface AvatarPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentAvatarUrl: string | null;
  onAvatarUpdated: (url: string) => void;
}

export function AvatarPickerModal({
  open,
  onOpenChange,
  userId,
  currentAvatarUrl,
  onAvatarUpdated,
}: AvatarPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentAvatarUrl);
  const [saving, setSaving] = useState(false);

  const handleSelectPreset = async (preset: PresetAvatar) => {
    setSelectedId(preset.id);
  };

  const handleConfirm = async () => {
    if (!selectedId) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    const res = await updateProfile(userId, { avatar_url: selectedId });
    setSaving(false);

    if (res.ok) {
      onAvatarUpdated(selectedId);
      toast.success("Avatar updated successfully!");
      onOpenChange(false);
    } else {
      toast.error(res.error ?? "Failed to update avatar");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <Dialog.Title className="font-display text-lg font-bold text-foreground">
                Choose Avatar
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                Select a character illustration for your profile
              </Dialog.Description>
            </div>
            <Dialog.Close className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Grid of Preset Avatars */}
          <div className="flex-1 overflow-y-auto py-6 px-1">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {PRESET_AVATARS.map((avatar) => {
                const isSelected = selectedId === avatar.id || selectedId === avatar.url;
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
                        isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {avatar.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? "Saving..." : "Confirm Selection"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
