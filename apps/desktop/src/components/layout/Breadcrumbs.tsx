import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400", className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />}
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors truncate max-w-[160px]"
              >
                {item.label}
              </button>
            ) : (
              <span
                className={cn(
                  "truncate max-w-[200px]",
                  isLast ? "text-zinc-800 dark:text-zinc-200 font-medium" : ""
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export { Breadcrumbs };
