import React from "react";

export interface SpecularButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  [key: string]: any;
}

declare const SpecularButton: React.ComponentType<SpecularButtonProps>;
export default SpecularButton;
