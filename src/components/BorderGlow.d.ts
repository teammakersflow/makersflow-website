import React from "react";

declare module "@/components/BorderGlow" {
  export interface BorderGlowProps {
    children?: React.ReactNode;
    borderRadius?: number;
    glowColor?: string;
    colors?: string[];
    backgroundColor?: string;
    glowIntensity?: number;
    className?: string;
    [key: string]: unknown;
  }
  const BorderGlow: React.ComponentType<BorderGlowProps>;
  export default BorderGlow;
}
