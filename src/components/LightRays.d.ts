import React from "react";

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
  [key: string]: any;
}

declare const LightRays: React.ComponentType<LightRaysProps>;
export default LightRays;
