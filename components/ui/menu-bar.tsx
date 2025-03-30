import * as React from "react";
import { cn } from "@/lib/utils";

export type MenuBarProps = React.HTMLAttributes<HTMLDivElement>;

export function MenuBar({ className, ...props }: MenuBarProps) {
  return (
    <div
      className={cn(
        "flex bg-[var(--win95-bg)] border-b border-[var(--win95-border-dark)]",
        className
      )}
      {...props}
    >
      <div className="mr-3 hover:bg-[var(--win95-button-highlight)] px-1 cursor-pointer">
        File
      </div>
      <div className="mr-3 hover:bg-[var(--win95-button-highlight)] px-1 cursor-pointer">
        Edit
      </div>
      <div className="mr-3 hover:bg-[var(--win95-button-highlight)] px-1 cursor-pointer">
        View
      </div>
      <div className="mr-3 hover:bg-[var(--win95-button-highlight)] px-1 cursor-pointer">
        Help
      </div>
    </div>
  );
}

interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  onClick?: () => void;
}

export function MenuItem({
  label,
  onClick,
  className,
  ...props
}: MenuItemProps) {
  return (
    <div
      className={cn(
        "px-1 py-0.5 cursor-pointer hover:bg-[var(--win95-titlebar)] hover:text-[var(--win95-titlebar-fg)]",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {label}
    </div>
  );
}

export type MenuListProps = React.HTMLAttributes<HTMLDivElement>;

export function MenuList({ children, className, ...props }: MenuListProps) {
  return (
    <div
      className={cn(
        "absolute z-50 bg-[var(--win95-bg)] border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] min-w-[120px] shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
