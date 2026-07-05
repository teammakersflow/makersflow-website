import { useCountUp } from "@/hooks/useCountUp";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface StreakCardProps {
  currentStreak: number;
  activeDays: boolean[]; // Array of 7 booleans for the last 7 days
  gradient: string;
}

export function StreakCard({ currentStreak, activeDays, gradient }: StreakCardProps) {
  const animatedStreak = useCountUp(currentStreak, 2000);

  return (
    <Card
      className={`relative overflow-hidden border-0 p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 ${gradient}`}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-white" fill="white" />
          <p className="text-sm font-medium text-white/80">Current Streak</p>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <h3 className="text-4xl font-bold text-white">{animatedStreak}</h3>
          <span className="text-lg font-medium text-white/80">days</span>
        </div>

        {/* 7-Day Indicator Strip */}
        <div className="mt-4 flex items-center gap-1.5">
          {activeDays.map((isActive, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all ${
                isActive ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-white/30"
              }`}
              title={`Day ${index + 1}`}
              aria-label={`Day ${index + 1}: ${isActive ? "Active" : "Inactive"}`}
            />
          ))}
        </div>

        <p className="mt-2 text-xs text-white/70">Last 7 days</p>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
    </Card>
  );
}
