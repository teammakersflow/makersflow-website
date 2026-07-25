import React from "react";

export interface CurvedLoopProps {
  marqueeText?: string;
  speed?: number;
  direction?: "left" | "right";
  interactive?: boolean;
  className?: string;
  [key: string]: any;
}

declare const CurvedLoop: React.ComponentType<CurvedLoopProps>;
export default CurvedLoop;
