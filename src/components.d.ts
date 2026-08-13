import React from "react";

declare module "*.jsx" {
  const component: React.ComponentType<any>;
  export default component;
}

declare module "@/components/DotField" {
  export interface DotFieldProps {
    dotRadius?: number;
    dotSpacing?: number;
    glowRadius?: number;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }
  const DotField: React.ComponentType<DotFieldProps>;
  export default DotField;
}

declare module "@/components/SpecularButton" {
  export interface SpecularButtonProps {
    children?: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    [key: string]: any;
  }
  const SpecularButton: React.ComponentType<SpecularButtonProps>;
  export default SpecularButton;
}

declare module "@/components/CurvedLoop" {
  export interface CurvedLoopProps {
    marqueeText?: string;
    speed?: number;
    direction?: "left" | "right";
    interactive?: boolean;
    className?: string;
    [key: string]: any;
  }
  const CurvedLoop: React.ComponentType<CurvedLoopProps>;
  export default CurvedLoop;
}






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
    [key: string]: any;
  }
  const LightRays: React.ComponentType<LightRaysProps>;
  export default LightRays;
}

declare module "@/components/ElasticSlider" {
  export interface ElasticSliderProps {
    defaultValue?: number;
    startingValue?: number;
    maxValue?: number;
    className?: string;
    [key: string]: any;
  }
  const ElasticSlider: React.ComponentType<ElasticSliderProps>;
  export default ElasticSlider;
}




declare module "@/components/TextType" {
  export interface TextTypeProps {
    text: string | string[];
    as?: React.ElementType;
    typingSpeed?: number;
    initialDelay?: number;
    pauseDuration?: number;
    deletingSpeed?: number;
    loop?: boolean;
    className?: string;
    showCursor?: boolean;
    hideCursorWhileTyping?: boolean;
    cursorCharacter?: string;
    cursorClassName?: string;
    cursorBlinkDuration?: number;
    textColors?: string[];
    variableSpeed?: { min: number; max: number };
    onSentenceComplete?: (sentence: string, index: number) => void;
    startOnVisible?: boolean;
    reverseMode?: boolean;
    [key: string]: any;
  }
  const TextType: React.ComponentType<TextTypeProps>;
  export default TextType;
}

declare module "@/components/LogoLoop" {
  export interface LogoLoopProps {
    logos: Array<{
      node?: React.ReactNode;
      src?: string;
      srcSet?: string;
      sizes?: string;
      width?: number | string;
      height?: number | string;
      alt?: string;
      title?: string;
      href?: string;
      ariaLabel?: string;
    }>;
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
    renderItem?: (item: any, key: string) => React.ReactNode;
    ariaLabel?: string;
    className?: string;
    style?: React.CSSProperties;
  }
  const LogoLoop: React.ComponentType<LogoLoopProps>;
  export default LogoLoop;
}

declare module "@/components/CountUp" {
  export interface CountUpProps {
    to: number;
    from?: number;
    direction?: "up" | "down";
    delay?: number;
    duration?: number;
    className?: string;
    startWhen?: boolean;
    separator?: string;
    onStart?: () => void;
    onEnd?: () => void;
  }
  const CountUp: React.ComponentType<CountUpProps>;
  export default CountUp;
}

declare module "framer-motion" {
  export const motion: any;
  export const AnimatePresence: any;
  export const useInView: any;
  export const useMotionValue: any;
  export const useSpring: any;
  export const useReducedMotion: any;
}
