import React from "react";

declare module "@/components/LightRays" {
  export interface LightRaysProps {
    raysOrigin?: string;
    raysColor?: string;
    raysSpeed?: number;
    lightSpread?: number;
    rayLength?: number;
    pulsating?: boolean;
    fadeDistance?: number;
    saturation?: number;
    followMouse?: boolean;
    mouseInfluence?: number;
    noiseAmount?: number;
    distortion?: number;
    className?: string;
    [key: string]: unknown;
  }
  const LightRays: React.ComponentType<LightRaysProps>;
  export default LightRays;
}
