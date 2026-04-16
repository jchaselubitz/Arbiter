import * as React from "react";
import { Moon, Sun, Monitor, Settings } from "lucide-react";
import type { AgentId, AgentSummary } from "@agent-permissions-editor/core";
import { AgentSwitcher } from "./AgentSwitcher";
import { RepoSelector } from "./RepoSelector";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { useUIStore } from "../../stores/useUIStore";
import { cn } from "../../lib/cn";

interface AppHeaderProps {
  repoPath: string | null;
  recentRepos: string[];
  summaries: AgentSummary[];
  selectedAgentId: AgentId | null;
  onChooseRepo: () => void;
  onSelectRecent: (path: string) => void;
  onSelectAgent: (agentId: AgentId) => void;
  onOpenSettings: () => void;
  platform?: string;
  className?: string;
}

function AppHeader({
  repoPath,
  recentRepos,
  summaries,
  selectedAgentId,
  onChooseRepo,
  onSelectRecent,
  onSelectAgent,
  onOpenSettings,
  platform,
  className
}: AppHeaderProps) {
  const { theme, setTheme } = useUIStore();

  return (
    <header
      data-tauri-drag-region
      className={cn(
        "flex h-11 shrink-0 items-center border-b border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/80 backdrop-blur-md",
        platform === "macos" && "titlebar-inset",
        className
      )}
      role="banner"
    >
      {/* Left: logo + repo selector */}
      <div className="flex items-center gap-2 px-3">
        <span
          className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 select-none"
          aria-hidden
        >
          agentgate
        </span>
        <RepoSelector
          repoPath={repoPath}
          recentRepos={recentRepos}
          onChooseRepo={onChooseRepo}
          onSelectRecent={onSelectRecent}
        />
      </div>

      {/* Center: agent switcher */}
      <div className="flex flex-1 items-center justify-center px-4">
        <AgentSwitcher
          summaries={summaries}
          selectedAgentId={selectedAgentId}
          onSelect={onSelectAgent}
          className="w-full max-w-xs"
        />
      </div>

      {/* Right: theme + settings */}
      <div className="flex items-center gap-1 px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Theme: ${theme}`}
            >
              {theme === "dark" ? (
                <Moon className="h-4 w-4" aria-hidden />
              ) : theme === "light" ? (
                <Sun className="h-4 w-4" aria-hidden />
              ) : (
                <Monitor className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="h-4 w-4" aria-hidden /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="h-4 w-4" aria-hidden /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="h-4 w-4" aria-hidden /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </header>
  );
}

export { AppHeader };
