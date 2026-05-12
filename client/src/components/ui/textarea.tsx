import * as React from "react";
import { cn } from "../../lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "deco-frame flex min-h-[8rem] w-full resize-y border-border-gold-muted bg-deco-surface px-3 py-2 font-mono text-sm leading-6 text-deco-foreground shadow-sm outline-none transition-colors placeholder:text-deco-muted focus:border-primary-gold focus:ring-2 focus:ring-primary-gold-muted",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";

export { Textarea };
