import * as React from "react";

import { cn } from "@/lib/utils";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "h-4 w-4 appearance-none rounded-none border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] bg-white checked:bg-white focus:outline-dashed focus:outline-1 focus:outline-[var(--win95-focus)] focus:outline-offset-1",
            className
          )}
          {...props}
        />
        <svg
          className="pointer-events-none absolute left-0 h-4 w-4 fill-current opacity-0 peer-checked:[&>path]:opacity-100"
          viewBox="0 0 16 16"
        >
          <path
            className="opacity-0 peer-checked:opacity-100"
            fill="black"
            d="M5 8l2 2 4-4-1-1-3 3-1-1z"
          />
        </svg>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
