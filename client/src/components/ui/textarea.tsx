import * as React from "react";
import { cn } from "../../lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[8rem] w-full resize-y rounded-none border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 py-2 text-sm leading-6 text-[color:var(--color-foreground)] shadow-sm outline-none transition-colors placeholder:text-[color:var(--color-muted-foreground)] focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-ring)] font-[ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation_Mono,Courier_New,monospace]",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";

export { Textarea };
