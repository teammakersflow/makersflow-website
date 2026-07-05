import { StatCard } from "./StatCard";
import { StreakCard } from "./StreakCard";

interface DashboardWidgetsProps {
  coursesEnrolled?: number;
  coursesCompleted?: number;
  averageScore?: number;
  currentStreak?: number;
  activeDays?: boolean[];
}

export function DashboardWidgets({
  coursesEnrolled = 12,
  coursesCompleted = 8,
  averageScore = 87,
  currentStreak = 15,
  activeDays = [true, true, true, false, true, true, true],
}: DashboardWidgetsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Courses Enrolled Card - Indigo */}
      <StatCard
        title="Courses Enrolled"
        value={coursesEnrolled}
        trend={{ value: "+2 this month", isPositive: true }}
        gradient="bg-gradient-to-br from-[#4F46E5] to-[#4338CA]"
      />

      {/* Courses Completed Card - Purple-Indigo */}
      <StatCard
        title="Completed"
        value={coursesCompleted}
        trend={{ value: "+3 recently", isPositive: true }}
        gradient="bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]"
      />

      {/* Average Score Card - Pink-Orange */}
      <StatCard
        title="Avg Score"
        value={averageScore}
        suffix="%"
        trend={{ value: "+5% vs last month", isPositive: true }}
        gradient="bg-gradient-to-br from-[#EC4899] to-[#F97316]"
      />

      {/* Streak Card - Orange */}
      <StreakCard
        currentStreak={currentStreak}
        activeDays={activeDays}
        gradient="bg-gradient-to-br from-[#FF6B35] to-[#F97316]"
      />
    </div>
  );
}
