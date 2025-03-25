declare module "react-resizable" {
  import React from "react";

  export interface ResizableProps {
    width: number;
    height: number;
    onResize: (
      e: React.SyntheticEvent,
      data: { size: { width: number; height: number } }
    ) => void;
    onResizeStop?: () => void;
    minConstraints?: [number, number];
    maxConstraints?: [number, number];
    handle?: React.ReactNode;
    resizeHandles?: string[];
    className?: string;
    children: React.ReactNode;
  }

  export const Resizable: React.ComponentType<ResizableProps>;
}
