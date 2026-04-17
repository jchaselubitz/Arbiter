import * as React from "react";
import { adapters } from "@arbiter/core";
import type { AgentId, AgentSummary } from "@arbiter/core";
import { Combobox } from "../ui/combobox";
import { StatusPill } from "../ui/status-pill";

// Agent config hints for "not detected" tooltip
const agentHints: Record<AgentId, string> = {
  "claude-code": "Not found — check ~/.claude/settings.json or .claude/settings.json in your repo",
  "openai-codex": "Not found — check ~/.codex/config.toml",
  cursor: "Not found — check .cursor/rules in your repo",
  gemini: "Not found — Gemini CLI support coming soon",
  antigravity: "Not found — Antigravity support coming soon",
  opencode: "Not found — check opencode.json in your repo"
};

interface AgentSwitcherProps {
  summaries: AgentSummary[];
  selectedAgentId: AgentId | null;
  onSelect: (agentId: AgentId) => void;
  className?: string;
}

function AgentSwitcher({ summaries, selectedAgentId, onSelect, className }: AgentSwitcherProps) {
  const summaryMap = new Map(summaries.map((s) => [s.agentId, s]));

  const options = adapters.map((adapter, index) => {
    const summary = summaryMap.get(adapter.id);
    const detected = summary && summary.status !== "not-found";
    const hint = detected ? undefined : agentHints[adapter.id];
    return {
      value: adapter.id,
      label: adapter.displayName,
      description: detected
        ? `${summary!.sources.filter((s) => s.exists).length} files found`
        : hint,
      disabled: !detected,
      icon: (
        <AgentIcon agentId={adapter.id} detected={!!detected} size={18} aria-hidden />
      ),
      statusEl: detected ? (
        <StatusPill
          tone={
            summary!.status === "parse-error"
              ? "danger"
              : summary!.status === "found"
                ? "ok"
                : "warn"
          }
          className="ml-auto"
        >
          {summary!.status}
        </StatusPill>
      ) : undefined,
      _shortcut: index < 6 ? `⌘${index + 1}` : undefined
    };
  });

  return (
    <Combobox
      options={options}
      value={selectedAgentId ?? undefined}
      onValueChange={(v) => onSelect(v as AgentId)}
      placeholder="Select agent"
      searchPlaceholder="Switch agent…"
      aria-label="Agent switcher"
      className={className}
    />
  );
}

interface AgentIconProps {
  agentId: AgentId;
  detected?: boolean;
  size?: number;
  className?: string;
  "aria-hidden"?: boolean;
}

function AgentIcon({ agentId, detected = true, size = 20, className, "aria-hidden": ariaHidden }: AgentIconProps) {
  const iconMap: Record<AgentId, string> = {
    "claude-code": new URL("../../../images/icons/claude-code.svg", import.meta.url).href,
    "openai-codex": new URL("../../../images/icons/codex.svg", import.meta.url).href,
    cursor: new URL("../../../images/icons/cursor.svg", import.meta.url).href,
    gemini: new URL("../../../images/icons/gemini.svg", import.meta.url).href,
    antigravity: new URL("../../../images/icons/antigravity.svg", import.meta.url).href,
    opencode: new URL("../../../images/icons/opencode.svg", import.meta.url).href
  };

  const src = iconMap[agentId];

  return (
    <img
      src={src}
      alt={detected ? "" : `${agentId} (not detected)`}
      width={size}
      height={size}
      aria-hidden={ariaHidden}
      style={{ opacity: detected ? 1 : 0.35, filter: detected ? "none" : "grayscale(1)" }}
      className={className}
    />
  );
}

export { AgentSwitcher, AgentIcon };
