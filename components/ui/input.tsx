import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-none border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] bg-white px-2 py-1 text-base text-[var(--win95-fg)] shadow-none focus:outline-dashed focus:outline-1 focus:outline-[var(--win95-focus)] focus:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
