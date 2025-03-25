import * as React from "react";
import { cn } from "@/lib/utils";

export interface WindowControlsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  onMaximize?: () => void;
  onMinimize?: () => void;
  showClose?: boolean;
  showMaximize?: boolean;
  showMinimize?: boolean;
}

const WindowControls = React.forwardRef<HTMLDivElement, WindowControlsProps>(
  (
    {
      className,
      onClose,
      onMaximize,
      onMinimize,
      showClose = true,
      showMaximize = true,
      showMinimize = true,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center space-x-1", className)}
        {...props}
      >
        {showMinimize && (
          <button
            onClick={onMinimize}
            className="flex h-4 w-4 items-center justify-center border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-button)] active:border-t-[var(--win95-border-dark)] active:border-l-[var(--win95-border-dark)] active:border-b-[var(--win95-border-light)] active:border-r-[var(--win95-border-light)]"
            aria-label="Minimize"
          >
            <svg
              width="6"
              height="2"
              viewBox="0 0 6 2"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="0" y="0" width="6" height="2" fill="black" />
            </svg>
          </button>
        )}
        {showMaximize && (
          <button
            onClick={onMaximize}
            className="flex h-4 w-4 items-center justify-center border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-button)] active:border-t-[var(--win95-border-dark)] active:border-l-[var(--win95-border-dark)] active:border-b-[var(--win95-border-light)] active:border-r-[var(--win95-border-light)]"
            aria-label="Maximize"
          >
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0"
                y="0"
                width="8"
                height="8"
                stroke="black"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </button>
        )}
        {showClose && (
          <button
            onClick={onClose}
            className="flex h-4 w-4 items-center justify-center border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-button)] active:border-t-[var(--win95-border-dark)] active:border-l-[var(--win95-border-dark)] active:border-b-[var(--win95-border-light)] active:border-r-[var(--win95-border-light)]"
            aria-label="Close"
          >
            <svg
              width="8"
              height="7"
              viewBox="0 0 8 7"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0H8V1H0V0Z" fill="black" />
              <path d="M1 1H7V2H1V1Z" fill="black" />
              <path d="M2 2H6V3H2V2Z" fill="black" />
              <path d="M3 3H5V4H3V3Z" fill="black" />
              <path d="M2 4H6V5H2V4Z" fill="black" />
              <path d="M1 5H7V6H1V5Z" fill="black" />
              <path d="M0 6H8V7H0V6Z" fill="black" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

WindowControls.displayName = "WindowControls";

export { WindowControls };
