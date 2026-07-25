import React from "react";

export interface TextTypeProps {
  text: string | string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  loop?: boolean;
  showCursor?: boolean;
  cursorCharacter?: string;
  className?: string;
  [key: string]: any;
}

declare const TextType: React.ComponentType<TextTypeProps>;
export default TextType;
