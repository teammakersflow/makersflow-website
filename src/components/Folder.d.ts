import React from "react";

declare module "@/components/Folder" {
  export interface FolderProps {
    title?: string;
    description?: string;
    items?: string[];
    className?: string;
    [key: string]: unknown;
  }
  const Folder: React.ComponentType<FolderProps>;
  export default Folder;
}
