import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { customAuthService } from "@/lib/auth/customAuthService";

export function DeleteAccountModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toLowerCase() !== "delete") return;
    setDeleting(true);

    try {
      const res = await customAuthService.deleteAccount();
      if (!res.success) {
        throw new Error(res.error ?? "Account deletion failed");
      }

      toast.success("Account deleted successfully");
      onClose();
      navigate({ to: "/" });
    } catch (e) {
      console.error("[DeleteAccountModal] Error:", e);
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => !deleting && onClose()}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            {/* Close button */}
            {!deleting && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Warning Icon */}
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-100 dark:bg-red-950/30">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <h2 className="font-display text-xl font-bold text-foreground">
              Delete your account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              This will <span className="font-semibold text-foreground">permanently</span> delete
              your account, profile, enrollments, progress, and all associated data.
              <br />
              <span className="font-semibold text-red-600">This action cannot be undone.</span>
            </p>

            <div className="mt-5">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Type <span className="text-red-600 font-black">delete</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete"
                disabled={deleting}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all disabled:opacity-50"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                className="flex-1 rounded-xl border border-border bg-secondary py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || confirmText.trim().toLowerCase() !== "delete"}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" /> Delete forever
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
