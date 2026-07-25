import React from "react";

export interface SpecularButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  size?: "sm" | "md" | "lg";
  radius?: number;
  tint?: string;
  lineColor?: string;
  baseColor?: string;
  textColor?: string;
  [key: string]: any;
}

declare const SpecularButton: React.ComponentType<SpecularButtonProps>;
export default SpecularButton;
