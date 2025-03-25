import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-none border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)] bg-[var(--win95-button)] text-[var(--win95-button-fg)] font-normal text-base transition-colors focus:outline-dashed focus:outline-1 focus:outline-[var(--win95-focus)] focus:outline-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "hover:bg-[var(--win95-button-highlight)] active:border-t-[var(--win95-border-dark)] active:border-l-[var(--win95-border-dark)] active:border-b-[var(--win95-border-light)] active:border-r-[var(--win95-border-light)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "bg-[var(--win95-button)] hover:bg-[var(--win95-button-highlight)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "border-0 bg-transparent hover:bg-[var(--win95-button-highlight)]",
        link: "border-0 bg-transparent underline-offset-4 hover:underline",
        win95: cn(
          "bg-[var(--win95-bg)] text-[var(--win95-fg)] font-[var(--win95-font)] rounded-none",
          "border-2 border-t-[var(--win95-border-light)] border-l-[var(--win95-border-light)] border-b-[var(--win95-border-dark)] border-r-[var(--win95-border-dark)]",
          "hover:bg-[var(--win95-button-highlight)]",
          "active:border-t-[var(--win95-border-dark)] active:border-l-[var(--win95-border-dark)] active:border-b-[var(--win95-border-light)] active:border-r-[var(--win95-border-light)]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--win95-focus)]",
          "disabled:opacity-70 disabled:pointer-events-none"
        ),
      },
      size: {
        default: "h-8 px-4 py-1 min-w-[75px]",
        sm: "h-7 px-3 py-0.5 min-w-[60px]",
        lg: "h-9 px-6 py-1.5 min-w-[90px]",
        icon: "h-8 w-8 p-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
