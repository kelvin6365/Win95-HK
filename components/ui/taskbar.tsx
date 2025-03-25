"use client";

import React, { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useWin95Store } from "@/lib/store";

interface TaskbarProps {
  onStartClick: () => void;
  taskbarItems?: ReactNode;
}

export function Taskbar({ onStartClick, taskbarItems }: TaskbarProps) {
  const startButtonRef = React.useRef<HTMLButtonElement>(null);
  const { isTaskbarOpen, currentTime } = useWin95Store();

  return (
    <div className="h-8 min-h-[32px] border-t-[var(--win95-border-light)] border-t-2 bg-[var(--win95-bg)] flex items-center">
      <button
        ref={startButtonRef}
        data-start-button
        onClick={onStartClick}
        className={cn(
          "h-6 mx-1 px-1 flex items-center text-xs font-bold",
          "border-2 relative",
          isTaskbarOpen
            ? "border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] bg-[var(--win95-button-pressed)]"
            : "border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)]"
        )}
      >
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 flex items-center justify-center">
            <WindowsLogo />
          </div>
          <span>Start</span>
        </div>
      </button>

      <div className="h-full border-l-2 border-[var(--win95-border-darker)] mx-1"></div>

      <div className="flex-1 flex items-center space-x-1 overflow-x-auto h-full px-1 py-1">
        {taskbarItems}
      </div>

      <div className="h-6 min-w-[70px] flex items-center justify-center border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] text-xs px-1 mx-1">
        {currentTime || "12:00 PM"}
      </div>
    </div>
  );
}

export interface TaskbarItemProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function TaskbarItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`h-[22px] px-1 min-w-[100px] max-w-[200px] flex items-center text-left border-2 mx-1 text-xs ${
        active
          ? "border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] bg-[var(--win95-button-highlight)]"
          : "border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-bg)]"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      <div className="truncate">{children}</div>
    </button>
  );
}

TaskbarItem.displayName = "TaskbarItem";

const WindowsLogo = () => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <rect x="1" y="1" width="6" height="6" fill="#FF0000" />
    <rect x="9" y="1" width="6" height="6" fill="#00FF00" />
    <rect x="1" y="9" width="6" height="6" fill="#0000FF" />
    <rect x="9" y="9" width="6" height="6" fill="#FFFF00" />
  </svg>
);
