import { toast } from "sonner";

export type ShareData = {
  title: string;
  text?: string;
  url?: string;
};

/**
 * Clean Web Share helper: uses navigator.share when supported,
 * otherwise falls back to copying link to clipboard with toast notification.
 */
export async function shareItem(data: ShareData): Promise<boolean> {
  const shareUrl = data.url || (typeof window !== "undefined" ? window.location.href : "");

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: shareUrl,
      });
      return true;
    } catch (err: any) {
      // Ignore AbortError caused when user cancels native share sheet
      if (err?.name === "AbortError") return false;
      console.warn("[shareItem] Native share failed, falling back to clipboard:", err);
    }
  }

  // Fallback: Copy link to clipboard
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard! 📋");
      return true;
    }
  } catch (err) {
    console.error("[shareItem] Clipboard copy failed:", err);
  }

  toast.error("Could not share link.");
  return false;
}
