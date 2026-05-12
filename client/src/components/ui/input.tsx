import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => (
    <input
      className={cn(
        "deco-frame flex h-11 w-full border-border-gold-muted bg-deco-surface px-3 py-2 text-sm text-deco-foreground shadow-sm outline-none transition-colors placeholder:text-deco-muted focus:border-primary-gold focus:ring-2 focus:ring-primary-gold-muted",
        className,
      )}
    ref={ref}
    {...props}
  />
));

Input.displayName = "Input";

export { Input };
