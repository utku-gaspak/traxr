import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        stamp:
          "border-[color:var(--color-primary)] bg-[color:rgba(255,255,255,0.8)] text-[color:var(--color-primary)]",
      },
    },
    defaultVariants: {
      variant: "stamp",
    },
  },
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
