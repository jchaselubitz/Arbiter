import * as React from "react";
import { cn } from "../../lib/cn";

function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-zinc-200 bg-zinc-100 px-1.5 font-mono text-[10px] font-medium opacity-100 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
        className
      )}
      {...props}
    />
  );
}

export { Kbd };
