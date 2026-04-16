import * as React from "react";
import type { AgentSummary } from "@agent-permissions-editor/core";
import type { AgentId } from "@agent-permissions-editor/core";
import { FileCode2, AlertCircle } from "lucide-react";
import { ExtensionMatrix } from "../../components/permission/ExtensionMatrix";
import { PermissionMatrix } from "../../components/permission/PermissionMatrix";
import { StatusPill } from "../../components/ui/status-pill";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Badge } from "../../components/ui/badge";
import { AgentIcon } from "../../components/layout/AgentSwitcher";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import { sourceLabel, sourceScopeLabel } from "../../lib/viewModels";
import { OpenInFinderButton } from "../../components/file/OpenInFinderButton";

interface AgentDetailProps {
  summary: AgentSummary | null;
  activeTab: AgentDetailTab;
  onTabChange: (tab: AgentDetailTab) => void;
  onSelectSource: (sourceId: string) => void;
  onNavigateHome: () => void;
}

export type AgentDetailTab = "permissions" | "extensions" | "files" | "rules";

function isAgentDetailTab(value: string): value is AgentDetailTab {
  return value === "permissions" || value === "extensions" || value === "files" || value === "rules";
}

function AgentDetail({ summary, activeTab, onTabChange, onSelectSource, onNavigateHome }: AgentDetailProps) {
  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-16">
        <AlertCircle className="h-10 w-10 text-zinc-300" aria-hidden />
        <p className="text-zinc-500 dark:text-zinc-400">Select an agent from the overview to view details.</p>
      </div>
    );
  }

  const tone = summary.status === "parse-error" ? "danger" : summary.status === "found" ? "ok" : "muted";

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Overview", onClick: onNavigateHome },
          { label: summary.displayName }
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <AgentIcon agentId={summary.agentId as AgentId} detected={summary.status !== "not-found"} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">{summary.displayName}</h1>
            <StatusPill tone={tone}>{summary.status}</StatusPill>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
            Adapter {summary.sources[0]?.adapterVersion ?? "0.1.0"} · docs reviewed {summary.sources[0]?.docsReviewedAt ?? "2026-04-15"}
          </p>
        </div>
      </div>

      {/* Diagnostics banner */}
      {summary.diagnostics.some((d) => d.severity === "error") && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" aria-hidden />
            <p className="text-sm text-red-700 dark:text-red-300">
              {summary.diagnostics.filter((d) => d.severity === "error").map((d) => d.message).join("; ")}
            </p>
          </div>
        </div>
      )}

      {/* Tabs: Permissions | Extensions | Files | Rules */}
      <Tabs
        value={activeTab}
        onValueChange={(value: string) => {
          if (isAgentDetailTab(value)) onTabChange(value);
        }}
      >
        <TabsList>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="extensions">Skills & Plugins</TabsTrigger>
          <TabsTrigger value="files">Files ({summary.sources.length})</TabsTrigger>
          <TabsTrigger value="rules">Rules ({summary.rules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="mt-4">
          {summary.status === "not-found" ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
              No configuration found for {summary.displayName} in this context.
            </p>
          ) : (
            <PermissionMatrix summary={summary} />
          )}
        </TabsContent>

        <TabsContent value="extensions" className="mt-4">
          {summary.extensions.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
              No skill or plugin configuration surfaces are modeled for {summary.displayName}.
            </p>
          ) : (
            <ExtensionMatrix summary={summary} onSelectSource={onSelectSource} />
          )}
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <div className="space-y-2">
            {summary.sources.map((source) => (
              <div
                key={source.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-[#1d7f68]/50 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <button
                  type="button"
                  onClick={() => onSelectSource(source.id)}
                  className="flex flex-1 items-start gap-3 text-left min-w-0"
                >
                  <FileCode2 className="h-4 w-4 shrink-0 mt-0.5 text-zinc-400" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={source.scope === "repo" ? "ok" : source.scope === "user" ? "warn" : "secondary"}>
                        {sourceScopeLabel(source)}
                      </Badge>
                      <p className="flex-1 min-w-0 font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                        {source.path}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {sourceLabel(source)} · {source.exists ? "exists" : "missing"} · {source.writeSupport}
                    </p>
                  </div>
                </button>
                {source.exists && (
                  <OpenInFinderButton
                    path={source.resolvedPath ?? source.path}
                    className="shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {summary.rules.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">No rules found.</p>
              ) : (
                summary.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start gap-2">
                      <code className="flex-1 text-xs font-mono text-zinc-700 dark:text-zinc-300 break-all">
                        {rule.raw}
                      </code>
                      <StatusPill
                        tone={rule.effect === "deny" ? "ok" : rule.effect === "allow" ? "warn" : "muted"}
                      >
                        {rule.effect}
                      </StatusPill>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{rule.explanation}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { AgentDetail };
