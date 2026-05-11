import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border text-sm font-semibold tracking-[0.08em] uppercase transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] hover:shadow-[0_0_15px_rgba(212,175,55,0.15)]",
        outline:
          "border-[color:var(--color-border-strong)] bg-[color:var(--color-card)] text-[color:var(--color-foreground)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]",
        ghost:
          "border-transparent bg-transparent text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]",
        accent:
          "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)] hover:shadow-[0_0_15px_rgba(4,99,7,0.16)]",
        stamp:
          "border-[color:var(--color-primary)] bg-[color:var(--color-card)] text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-soft)]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3 py-2 text-xs",
        lg: "h-12 px-6 py-3",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
