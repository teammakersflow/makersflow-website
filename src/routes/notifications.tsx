import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Info, CheckCircle2, AlertTriangle, Megaphone, ArrowUpRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { markNotificationsAsRead } from "@/lib/notifications";
import { toast } from "sonner";

type NotificationType = "info" | "success" | "warning" | "announcement" | string;

type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

const TYPE_META: Record<string, { icon: typeof Info; label: string; className: string }> = {
  info: { icon: Info, label: "Info", className: "bg-blue-500/10 text-blue-600" },
  success: { icon: CheckCircle2, label: "Update", className: "bg-emerald-500/10 text-emerald-600" },
  warning: { icon: AlertTriangle, label: "Alert", className: "bg-amber-500/10 text-amber-600" },
  announcement: { icon: Megaphone, label: "Announcement", className: "bg-primary/10 text-primary" },
};

const DEFAULT_META = TYPE_META.info;

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MakersFlow" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("notifications")
      .select("id, title, body, type, link_url, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setNotifications((data as Notification[]) ?? []);
        setLoading(false);
        markNotificationsAsRead(user.id);
      });
  }, [user]);

  const handleDeleteNotification = async (id: string) => {
    if (!user) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[notifications] Delete failed:", error);
      toast.error("Could not delete notification");
    } else {
      toast.success("Notification removed");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="grid flex-1 place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
              MakersFlow Alerts
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Updates and account alerts sent directly to you.
            </p>
          </header>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {notifications.map((n) => {
                const meta = n.type && TYPE_META[n.type] ? TYPE_META[n.type] : DEFAULT_META;
                const Icon = meta.icon;
                return (
                  <article
                    key={n.id}
                    className="group relative flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.className}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 pr-8">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-foreground">{n.title}</h2>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        {!n.is_read && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {n.body && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {n.body}
                        </p>
                      )}
                      {n.link_url && (
                        <a
                          href={n.link_url}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                          View details
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteNotification(n.id)}
                      className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
