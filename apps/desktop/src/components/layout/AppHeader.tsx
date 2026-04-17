import * as React from "react";
import { ChevronLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { AgentId, AgentSummary, DiscoveryResult } from "@arbiter/core";
import { adapters } from "@arbiter/core";
import { AgentSwitcher, AgentIcon } from "./AgentSwitcher";
import { RepoSelector } from "./RepoSelector";
import { Button } from "../ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/cn";
import {
  commonAgentPermissionPresets,
  getPermittedBashCommandTarget,
  permittedBashCommandLabel,
  permittedBashCommandValue,
  supportsPermittedBashCommands
} from "../../lib/permittedBashCommands";

const NO_DRAG_SELECTOR =
  'a,button,input,select,textarea,[contenteditable="true"],[role="button"],[role="combobox"],[role="menuitem"]';

interface AppHeaderProps {
  repoPath: string | null;
  recentRepos: string[];
  summaries: AgentSummary[];
  selectedAgentId: AgentId | null;
  result: DiscoveryResult | null;
  onChooseRepo: () => void;
  onSelectRecent: (path: string) => void;
  onSelectAgent: (agentId: AgentId) => void;
  onGoBack: () => void;
  canGoBack: boolean;
  onPermitBashCommands: (agentIds: AgentId[], commands: string[], label: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  platform?: string;
  className?: string;
}

function AppHeader({
  repoPath,
  recentRepos,
  summaries,
  selectedAgentId,
  result,
  onChooseRepo,
  onSelectRecent,
  onSelectAgent,
  onGoBack,
  canGoBack,
  onPermitBashCommands,
  onRefresh,
  isRefreshing = false,
  platform,
  className
}: AppHeaderProps) {
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

      {/* Right: refresh + common permission presets */}
      <div className="flex items-center gap-1 px-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh config"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Reload config files from disk"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} aria-hidden />
        </Button>
        <CommonPermissionsPopover result={result} onPermitBashCommands={onPermitBashCommands} />
      </div>
    </header>
  );
}

function CommonPermissionsPopover({
  result,
  onPermitBashCommands
}: {
  result: DiscoveryResult | null;
  onPermitBashCommands: (agentIds: AgentId[], commands: string[], label: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedPresetId, setSelectedPresetId] = React.useState(commonAgentPermissionPresets[0]?.id ?? "custom");
  const [customCommand, setCustomCommand] = React.useState("");
  const [selectedAgentIds, setSelectedAgentIds] = React.useState<AgentId[]>([]);
  const selectedPreset = commonAgentPermissionPresets.find((preset) => preset.id === selectedPresetId) ?? null;
  const plannedCommands = selectedPreset
    ? selectedPreset.commands
    : customCommand.trim()
      ? [customCommand.trim()]
      : [];

  const summariesByAgent = React.useMemo(
    () => new Map((result?.summaries ?? []).map((summary) => [summary.agentId, summary])),
    [result]
  );

  const targets = React.useMemo(
    () =>
      (result?.summaries ?? [])
        .filter((summary) => supportsPermittedBashCommands(summary.agentId))
        .map((summary) => ({ summary, source: getPermittedBashCommandTarget(summary) })),
    [result]
  );

  const selectableIds = targets.filter((t) => t.source).map((t) => t.summary.agentId);

  React.useEffect(() => {
    setSelectedAgentIds((current) => current.filter((agentId) => selectableIds.includes(agentId)));
  }, [selectableIds.join("|")]);

  function toggleAgent(agentId: AgentId, checked: boolean | "indeterminate") {
    setSelectedAgentIds((current) => {
      if (checked === true) return current.includes(agentId) ? current : [...current, agentId];
      return current.filter((id) => id !== agentId);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (plannedCommands.length === 0 || selectedAgentIds.length === 0) return;
    onPermitBashCommands(selectedAgentIds, plannedCommands, selectedPreset?.label ?? "Custom command");
    setCustomCommand("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <ShieldCheck className="h-4 w-4 text-[#1d7f68] dark:text-[#3dd6aa]" aria-hidden />
          Common Permissions
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[480px] p-0">
        <div className="px-4 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#1d7f68] dark:text-[#3dd6aa]" aria-hidden />
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Common Permissions</h3>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Recommended command groups for routine coding tasks.
          </p>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
              Permission set
            </p>
            <ScrollArea className="max-h-72 pr-2">
              <div className="grid grid-cols-1 gap-2">
                {commonAgentPermissionPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      selectedPresetId === preset.id
                        ? "border-[#1d7f68] bg-[#e9f7f3] dark:border-[#3dd6aa] dark:bg-[#102c25]"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{preset.label}</span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize",
                          preset.risk === "low"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : preset.risk === "medium"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        )}
                      >
                        {preset.risk}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{preset.description}</span>
                    <code className="mt-1.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {preset.commands.join(", ")}
                    </code>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedPresetId("custom")}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    selectedPresetId === "custom"
                      ? "border-[#1d7f68] bg-[#e9f7f3] dark:border-[#3dd6aa] dark:bg-[#102c25]"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  )}
                >
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Custom command</span>
                  <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                    One project-specific shell command.
                  </span>
                </button>
              </div>
            </ScrollArea>
          </div>

          {selectedPresetId === "custom" && (
            <div className="space-y-1.5">
              <Label htmlFor="header-bash-command">Command</Label>
              <Input
                id="header-bash-command"
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
                placeholder="npm test"
                autoFocus
              />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
              Agents
            </p>
            <ScrollArea className="max-h-52">
              <div className="space-y-2 pr-1">
                {adapters.map((adapter) => {
                  const agentId = adapter.id as AgentId;
                  const summary = summariesByAgent.get(agentId);
                  const target = summary ? getPermittedBashCommandTarget(summary) : null;
                  const supported = supportsPermittedBashCommands(agentId);
                  const disabled = !supported || !target;
                  const preview = supported && plannedCommands.length > 0
                    ? plannedCommands.map((command) => permittedBashCommandValue(agentId, command))
                    : [];
                  return (
                    <label
                      key={agentId}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer",
                        disabled
                          ? "border-zinc-100 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-950 cursor-default"
                          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                      )}
                    >
                      <Checkbox
                        checked={selectedAgentIds.includes(agentId)}
                        onCheckedChange={(checked: boolean | "indeterminate") => toggleAgent(agentId, checked)}
                        disabled={disabled}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <AgentIcon agentId={agentId} detected={!!summary && summary.status !== "not-found"} size={18} />
                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                            {permittedBashCommandLabel(agentId)}
                          </span>
                        </span>
                        {target && (
                          <span className="mt-1 block truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {target.path}
                          </span>
                        )}
                        {!supported && (
                          <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                            Per-command bash allow is not supported by this agent.
                          </span>
                        )}
                        {supported && !target && (
                          <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                            No writable settings file available.
                          </span>
                        )}
                        {preview.length > 0 && (
                          <span className="mt-1 block space-y-0.5">
                            {preview.slice(0, 3).map((value) => (
                              <code key={value} className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                                {value}
                              </code>
                            ))}
                            {preview.length > 3 && (
                              <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                                +{preview.length - 3} more
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={plannedCommands.length === 0 || selectedAgentIds.length === 0}>
              Preview changes
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export { AppHeader };
