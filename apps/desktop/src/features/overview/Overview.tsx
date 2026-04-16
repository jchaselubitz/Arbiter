import * as React from "react";
import type { DiscoveryResult, AgentSummary } from "@agent-permissions-editor/core";
import type { AgentId } from "@agent-permissions-editor/core";
import { adapters } from "@agent-permissions-editor/core";
import { AlertTriangle, CheckCircle2, FolderOpen, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusPill } from "../../components/ui/status-pill";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { AgentIcon } from "../../components/layout/AgentSwitcher";
import { riskLevel, agentStatus } from "../../lib/viewModels";
import { cn } from "../../lib/cn";

interface OverviewProps {
  result: DiscoveryResult | null;
  repoPath: string | null;
  loading?: boolean;
  onSelectAgent: (agentId: AgentId) => void;
  onChooseRepo: () => void;
}

function Overview({ result, repoPath, loading = false, onSelectAgent, onChooseRepo }: OverviewProps) {
  if (loading) return <OverviewSkeleton />;

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-8 py-16 text-center">
        <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-5">
          <FolderOpen className="h-10 w-10 text-zinc-400" aria-hidden />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Choose a repository</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Select a folder to inspect agent config files in that project. User-level configs are
            always loaded.
          </p>
        </div>
        <Button onClick={onChooseRepo}>
          <FolderOpen className="h-4 w-4" aria-hidden />
          Choose repository…
        </Button>
        <AllAgentsEmptyList onChooseRepo={onChooseRepo} />
      </div>
    );
  }

  const risk = riskLevel(result);
  const summaryMap = new Map(result.summaries.map((s) => [s.agentId, s]));

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Overview</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
            {repoPath ?? "User-level configs only"}
          </p>
        </div>
        <StatusPill tone={risk === "high" ? "danger" : risk === "medium" ? "warn" : "ok"}>
          {risk} risk
        </StatusPill>
      </div>

      {/* High-risk findings */}
      {result.highRiskFindings.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">High-risk findings</h3>
          </div>
          <ul className="space-y-1">
            {result.highRiskFindings.map((finding) => (
              <li key={finding} className="text-sm text-red-700 dark:text-red-300">
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Agent cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {adapters.map((adapter) => {
          const summary = summaryMap.get(adapter.id);
          return (
            <AgentCard
              key={adapter.id}
              adapter={adapter}
              summary={summary ?? null}
              onSelect={() => onSelectAgent(adapter.id as AgentId)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface AgentCardProps {
  adapter: { id: string; displayName: string };
  summary: AgentSummary | null;
  onSelect: () => void;
}

function AgentCard({ adapter, summary, onSelect }: AgentCardProps) {
  const detected = summary && summary.status !== "not-found";
  const status = summary ? agentStatus(summary) : "Not detected";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border p-4 text-left transition-all",
        detected
          ? "border-zinc-200 bg-white hover:border-[#1d7f68]/50 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-[#3dd6aa]/50"
          : "border-zinc-100 bg-zinc-50 opacity-60 hover:opacity-80 dark:border-zinc-800 dark:bg-zinc-950"
      )}
      aria-label={`${adapter.displayName}: ${status}`}
    >
      <div className="flex items-center justify-between">
        <AgentIcon agentId={adapter.id as AgentId} detected={!!detected} size={24} />
        {summary && (
          <StatusPill
            tone={
              summary.status === "parse-error"
                ? "danger"
                : summary.status === "found"
                  ? "ok"
                  : "warn"
            }
          >
            {summary.status}
          </StatusPill>
        )}
        {!summary && (
          <StatusPill tone="muted">not detected</StatusPill>
        )}
      </div>
      <div>
        <p className="font-medium text-zinc-800 dark:text-zinc-100">{adapter.displayName}</p>
        {detected && summary && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {summary.sources.filter((s) => s.exists).length} files · {summary.unknownCount} unknown keys
          </p>
        )}
        {!detected && (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">Not detected in this repo</p>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-[#1d7f68] dark:text-[#3dd6aa] opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View details</span>
        <ChevronRight className="h-3 w-3" aria-hidden />
      </div>
    </button>
  );
}

function AllAgentsEmptyList({ onChooseRepo }: { onChooseRepo: () => void }) {
  return (
    <div className="w-full max-w-lg mt-4 space-y-2 text-left">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 px-2">
        Supported agents
      </p>
      {adapters.map((adapter) => (
        <div
          key={adapter.id}
          className="flex items-center gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <AgentIcon agentId={adapter.id as AgentId} detected={false} size={18} />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{adapter.displayName}</span>
          <StatusPill tone="muted" className="ml-auto">not detected</StatusPill>
        </div>
      ))}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export { Overview };
