import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#1d7f68] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#1d7f68] text-white",
        secondary: "border-transparent bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
        destructive: "border-transparent bg-red-600 text-white",
        outline: "border-zinc-200 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100",
        ok: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        warn: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        danger: "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        muted: "border-transparent bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
