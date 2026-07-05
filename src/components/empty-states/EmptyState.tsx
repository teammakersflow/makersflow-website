import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  variant?: "default" | "locked";
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
}: EmptyStateProps) {
  return (
    <Card className="border-border/40 bg-card shadow-sm">
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:px-12 sm:py-20">
        {/* Animated Icon */}
        <div className="mb-6 animate-float">
          <div className="rounded-full bg-muted/50 p-6 dark:bg-muted/30">{icon}</div>
        </div>

        {/* Heading */}
        <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-3 max-w-md text-base text-muted-foreground sm:text-lg">{description}</p>

        {/* CTA Button */}
        <Button
          onClick={onAction}
          size="lg"
          className="mt-8 bg-[#4F46E5] px-8 hover:bg-[#4338CA] dark:bg-[#4F46E5] dark:hover:bg-[#4338CA]"
        >
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}
