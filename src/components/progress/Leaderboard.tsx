import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Flame, Medal, Award, User, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  streakDays: number;
  isSelf: boolean;
};

export function Leaderboard({ currentUserId }: { currentUserId?: string }) {
  const leaderboardQ = useQuery({
    queryKey: ["leaderboard", currentUserId],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data: streakData, error: streakError } = await supabase
        .from("streaks")
        .select("user_id, longest_streak, current_streak")
        .order("longest_streak", { ascending: false })
        .limit(10);

      if (streakError || !streakData || streakData.length === 0) return [];

      const userIds = streakData.map((s) => s.user_id).filter(Boolean);

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));

      // Filter out orphaned streak rows that have no matching profile and are not the current user
      const validStreakRows = streakData.filter(
        (s) => profileMap.has(s.user_id) || (currentUserId && s.user_id === currentUserId),
      );

      return validStreakRows.map((s, index) => {
        const profile = profileMap.get(s.user_id);
        const displayName =
          profile?.full_name?.trim() ||
          (s.user_id === currentUserId ? "You" : `Learner #${s.user_id.slice(0, 5)}`);

        return {
          rank: index + 1,
          userId: s.user_id,
          name: s.user_id === currentUserId ? `${displayName} (You)` : displayName,
          avatarUrl: profile?.avatar_url ?? null,
          streakDays: Number(s.longest_streak ?? s.current_streak ?? 0),
          isSelf: s.user_id === currentUserId,
        };
      });
    },
    enabled: true,
  });

  const entries = leaderboardQ.data ?? [];
  const isLoading = leaderboardQ.isLoading;

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-amber-500/10 via-primary/5 to-accent/10 p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-500">
                <Trophy className="h-5 w-5" />
              </span>
              <h2 className="font-display text-2xl font-bold text-foreground">Top Learners</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Ranked by longest learning streak — consistency is your superpower.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
            Streak Leaderboard
          </div>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="font-display text-lg font-bold text-foreground">No rankings yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete daily lessons to build your streak and claim the top rank!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((item, index) => {
            const isTop1 = item.rank === 1;
            const isTop2 = item.rank === 2;
            const isTop3 = item.rank === 3;

            return (
              <motion.div
                key={item.userId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all",
                  item.isSelf
                    ? "border-primary bg-primary/8 shadow-[var(--shadow-glow-primary)]"
                    : "border-border bg-card hover:border-border/80 hover:bg-secondary/40",
                  isTop1 && !item.isSelf && "border-amber-500/40 bg-amber-500/5",
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Rank badge */}
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-base font-black shadow-sm",
                      isTop1 && "bg-amber-500 text-black shadow-amber-500/30",
                      isTop2 && "bg-slate-300 text-slate-900 shadow-slate-300/30",
                      isTop3 && "bg-amber-700 text-white shadow-amber-700/30",
                      !isTop1 && !isTop2 && !isTop3 && "bg-secondary text-muted-foreground",
                    )}
                  >
                    {isTop1 ? (
                      <Trophy className="h-5 w-5 fill-black text-black" />
                    ) : isTop2 ? (
                      <Medal className="h-5 w-5" />
                    ) : isTop3 ? (
                      <Award className="h-5 w-5" />
                    ) : (
                      `#${item.rank}`
                    )}
                  </div>

                  {/* User info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-bold text-foreground">
                        {item.name}
                      </span>
                      {item.isSelf && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {isTop1 ? "👑 Leader" : `#${item.rank} Rank`}
                    </span>
                  </div>
                </div>

                {/* Score / Streak points */}
                <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3.5 py-2 font-display text-sm font-bold text-foreground shrink-0">
                  <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span>{item.streakDays} Days</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
