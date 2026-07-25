import React from "react";

export interface LogoItem {
  node?: React.ReactNode;
  src?: string;
  srcDark?: string;
  alt?: string;
  title?: string;
  href?: string;
  ariaLabel?: string;
  [key: string]: any;
}

export interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: "left" | "right" | "up" | "down";
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

declare const LogoLoop: React.ComponentType<LogoLoopProps>;
export default LogoLoop;
