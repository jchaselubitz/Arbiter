import * as React from "react";
import { FolderOpen, ChevronDown, History, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { cn } from "../../lib/cn";

interface RepoSelectorProps {
  repoPath: string | null;
  recentRepos: string[];
  onChooseRepo: () => void;
  onSelectRecent: (path: string) => void;
  className?: string;
}

function basename(path: string): string {
  return path.split("/").filter(Boolean).at(-1) ?? path;
}

function truncatePath(path: string, maxLen = 40): string {
  if (path.length <= maxLen) return path;
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 2) return path;
  return `…/${parts.at(-2)}/${parts.at(-1)}`;
}

function RepoSelector({ repoPath, recentRepos, onChooseRepo, onSelectRecent, className }: RepoSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-8 items-center gap-2 rounded-md px-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1d7f68] transition-colors",
          className
        )}
        aria-label={repoPath ? `Current repo: ${basename(repoPath)}` : "Choose repository"}
      >
        <FolderOpen className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
        <span className="max-w-[180px] truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
          {repoPath ? basename(repoPath) : <span className="text-zinc-400">No repo</span>}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[260px]">
        {repoPath && (
          <>
            <DropdownMenuLabel className="text-zinc-500 font-normal">
              <span className="block font-mono text-xs" title={repoPath}>{truncatePath(repoPath)}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onChooseRepo}>
          <FolderOpen className="h-4 w-4" aria-hidden />
          Change repository…
        </DropdownMenuItem>
        {recentRepos.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Recent</DropdownMenuLabel>
            {recentRepos.filter((r) => r !== repoPath).slice(0, 4).map((r) => (
              <DropdownMenuItem key={r} onClick={() => onSelectRecent(r)}>
                <History className="h-4 w-4 text-zinc-400" aria-hidden />
                <span className="truncate font-mono text-xs" title={r}>{truncatePath(r, 35)}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { RepoSelector };
