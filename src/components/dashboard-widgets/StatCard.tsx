import { useCountUp } from "@/hooks/useCountUp";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  gradient: string;
  suffix?: string;
}

export function StatCard({ title, value, trend, gradient, suffix = "" }: StatCardProps) {
  const animatedValue = useCountUp(value, 2000);

  return (
    <Card
      className={`relative overflow-hidden border-0 p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 ${gradient}`}
    >
      <div className="relative z-10">
        <p className="text-sm font-medium text-white/80">{title}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <h3 className="text-4xl font-bold text-white">
            {animatedValue}
            {suffix}
          </h3>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-sm text-white/90">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="font-medium">{trend.value}</span>
          </div>
        )}
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
    </Card>
  );
}
