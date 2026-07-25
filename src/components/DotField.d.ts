import React from "react";

export interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  glowRadius?: number;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

declare const DotField: React.ComponentType<DotFieldProps>;
export default DotField;
