import React from "react";

declare module "@/components/Stepper" {
  export interface StepProps {
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export const Step: React.ComponentType<StepProps>;

  export interface StepperProps {
    children?: React.ReactNode;
    initialStep?: number;
    onStepChange?: (step: number) => void;
    onFinalStepCompleted?: () => void;
    stepCircleContainerClassName?: string;
    stepContainerClassName?: string;
    contentClassName?: string;
    footerClassName?: string;
    backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    backButtonText?: string;
    nextButtonText?: string;
    disableStepIndicators?: boolean;
    renderStepIndicator?: (props: {
      step: number;
      currentStep: number;
      onStepClick: (clicked: number) => void;
      isComplete: boolean;
      isCurrent: boolean;
    }) => React.ReactNode;
    [key: string]: unknown;
  }
  const Stepper: React.ComponentType<StepperProps>;
  export default Stepper;
}
