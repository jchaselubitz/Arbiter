import * as React from "react";
import { ChevronLeft, Moon, Sun, Monitor, Settings } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
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

const NO_DRAG_SELECTOR =
  'a,button,input,select,textarea,[contenteditable="true"],[role="button"],[role="combobox"],[role="menuitem"]';

interface AppHeaderProps {
  repoPath: string | null;
  recentRepos: string[];
  summaries: AgentSummary[];
  selectedAgentId: AgentId | null;
  onChooseRepo: () => void;
  onSelectRecent: (path: string) => void;
  onSelectAgent: (agentId: AgentId) => void;
  onGoBack: () => void;
  canGoBack: boolean;
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
  onGoBack,
  canGoBack,
  onOpenSettings,
  platform,
  className
}: AppHeaderProps) {
  const { theme, setTheme } = useUIStore();

  function handleHeaderMouseDown(event: React.MouseEvent<HTMLElement>) {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement | null;
    const interactiveTarget = target?.closest(NO_DRAG_SELECTOR);

    if (interactiveTarget && interactiveTarget !== event.currentTarget) {
      return;
    }

    event.preventDefault();
    void getCurrentWindow().startDragging();
  }

  return (
    <header
      onMouseDown={handleHeaderMouseDown}
      className={cn(
        "flex h-11 shrink-0 cursor-default select-none items-center border-b border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/80 backdrop-blur-md",
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
          Arbiter
        </span>
        <RepoSelector
          repoPath={repoPath}
          recentRepos={recentRepos}
          onChooseRepo={onChooseRepo}
          onSelectRecent={onSelectRecent}
        />
      </div>

      {/* Center: back button + agent switcher */}
      <div className="flex flex-1 items-center justify-center gap-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Go back"
          onClick={onGoBack}
          disabled={!canGoBack}
          className="shrink-0"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
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
