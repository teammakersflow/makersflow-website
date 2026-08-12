import {
  Bot,
  Brain,
  Box,
  CircuitBoard,
  Code2,
  Cpu,
  Hammer,
  Leaf,
  Lightbulb,
  Package,
  Radio,
  Rocket,
  Share2,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const registry: Record<string, LucideIcon> = {
  Bot,
  Brain,
  Box,
  CircuitBoard,
  Code2,
  Cpu,
  Hammer,
  Leaf,
  Lightbulb,
  Package,
  Radio,
  Rocket,
  Share2,
  Wrench,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Component = registry[name] ?? Box;
  return <Component className={className} aria-hidden="true" />;
}
