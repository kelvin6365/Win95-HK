import * as React from "react";

import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "h-8 w-full appearance-none rounded-none border-2 border-t-[var(--win95-border-dark)] border-l-[var(--win95-border-dark)] border-b-[var(--win95-border-light)] border-r-[var(--win95-border-light)] bg-white px-2 py-1 pr-8 text-base text-[var(--win95-fg)] focus:outline-dashed focus:outline-1 focus:outline-[var(--win95-focus)] focus:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
          <div className="h-5 w-5 border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-button)]">
            <svg
              width="11"
              height="6"
              viewBox="0 0 11 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-[3px] top-[7px]"
            >
              <path d="M0 0H11L5.5 6L0 0Z" fill="black" />
            </svg>
          </div>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

const SelectOption = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, ...props }, ref) => (
  <option
    className={cn("bg-white text-[var(--win95-fg)]", className)}
    ref={ref}
    {...props}
  />
));
SelectOption.displayName = "SelectOption";

export { Select, SelectOption };
