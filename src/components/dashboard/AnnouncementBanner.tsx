import { useEffect, useState } from "react";
import { Megaphone, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

type Announcement = {
  id: string;
  title: string;
  message: string | null;
  type: string | null;
  link_url: string | null;
  status: string;
};

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    supabase
      .from("announcements")
      .select("id, title, message, type, link_url, status")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (data && !error) {
          const dismissedId = sessionStorage.getItem(`dismissed_announcement_${data.id}`);
          if (!dismissedId) {
            setAnnouncement(data as Announcement);
          }
        }
      });
  }, []);

  if (!announcement || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">{announcement.title}</h4>
              {announcement.message && (
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {announcement.message}
                </p>
              )}
              {announcement.link_url && (
                <a
                  href={announcement.link_url}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Learn more <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              sessionStorage.setItem(`dismissed_announcement_${announcement.id}`, "true");
              setDismissed(true);
            }}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
