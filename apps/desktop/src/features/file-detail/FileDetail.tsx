import * as React from "react";
import { useState } from "react";
import type { DiscoveryResult, SourceFile, PermissionIntent } from "@agent-permissions-editor/core";
import { AlertCircle, FileCode2 } from "lucide-react";
import { StatusPill } from "../../components/ui/status-pill";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../components/ui/sheet";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { sourceLabel, sourceScopeLabel, rulesForSource } from "../../lib/viewModels";
import { OpenInFinderButton } from "../../components/file/OpenInFinderButton";

interface FileDetailProps {
  result: DiscoveryResult | null;
  source: SourceFile | null;
  onPlan: (source: SourceFile, intent: PermissionIntent, value: string, actionLabel: string) => void;
  onNavigateAgent: () => void;
  onNavigateHome: () => void;
  agentDisplayName?: string;
}

function FileDetail({ result, source, onPlan, onNavigateAgent, onNavigateHome, agentDisplayName }: FileDetailProps) {
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [ruleValue, setRuleValue] = useState("");

  if (!result || !source) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-16">
        <FileCode2 className="h-10 w-10 text-zinc-300" aria-hidden />
        <p className="text-zinc-500 dark:text-zinc-400">Select a file from an agent detail page.</p>
      </div>
    );
  }

  const parsed = result.parsedSources.find((item) => item.source.id === source.id);
  const rules = rulesForSource(result, source.id);
  const canEdit = ["safe-write", "partial"].includes(source.writeSupport);
  const basename = source.path.split("/").at(-1) ?? source.path;

  const tone = source.writeSupport === "safe-write" ? "ok" : source.writeSupport === "partial" ? "warn" : "muted";

  function handlePlanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ruleValue.trim()) return;
    const intent: PermissionIntent = source!.agentId === "openai-codex" ? "set-default-mode" : "add-deny-rule";
    const actionLabel = `Add deny rule: ${ruleValue}`;
    onPlan(source!, intent, ruleValue, actionLabel);
    setPlanSheetOpen(false);
    setRuleValue("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-6 space-y-5 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Overview", onClick: onNavigateHome },
          { label: agentDisplayName ?? source.agentId, onClick: onNavigateAgent },
          { label: basename }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2">
            <Badge variant={source.scope === "repo" ? "ok" : source.scope === "user" ? "warn" : "secondary"}>
              {sourceScopeLabel(source)}
            </Badge>
          </div>
          <h1 className="font-mono text-lg font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {source.path}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {sourceLabel(source)} · precedence {source.precedence ?? "n/a"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill tone={tone}>{source.writeSupport}</StatusPill>
          {source.exists && (
            <OpenInFinderButton
              path={source.resolvedPath ?? source.path}
              label="Open in Finder"
            />
          )}
          <Button
            size="sm"
            onClick={() => setPlanSheetOpen(true)}
            disabled={!canEdit}
            aria-disabled={!canEdit}
          >
            Plan edit
          </Button>
        </div>
      </div>

      {/* Symlink warning */}
      {source.isSymlink && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Symlink → {source.resolvedPath}
          </p>
        </div>
      )}

      {/* Diagnostics */}
      {parsed?.diagnostics && parsed.diagnostics.length > 0 && (
        <div className="space-y-1">
          {parsed.diagnostics.map((d) => (
            <div
              key={`${d.code}-${d.message}`}
              className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
                d.severity === "error"
                  ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                  : "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
              }`}
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
              {d.message}
            </div>
          ))}
        </div>
      )}

      {/* Parsed rules */}
      {rules.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Parsed rules</h2>
          <div className="space-y-1.5">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-3 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <code className="flex-1 text-xs font-mono text-zinc-700 dark:text-zinc-300">{rule.raw}</code>
                <StatusPill
                  tone={rule.effect === "deny" ? "ok" : rule.effect === "allow" ? "warn" : "muted"}
                >
                  {rule.effect}
                </StatusPill>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Raw content */}
      <section className="flex min-h-0 flex-1 flex-col">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Raw content</h2>
        <ScrollArea className="h-full min-h-0 rounded-lg border border-zinc-200 bg-zinc-950 dark:border-zinc-700">
          <pre className="p-4 text-xs font-mono text-zinc-300 whitespace-pre-wrap break-all">
            {source.content ?? <span className="text-zinc-500 italic">File does not exist yet.</span>}
          </pre>
        </ScrollArea>
      </section>

      {/* Plan edit sheet */}
      <Sheet open={planSheetOpen} onOpenChange={setPlanSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle>Plan edit</SheetTitle>
            <SheetDescription>
              Add a rule to <code className="font-mono text-xs">{basename}</code>.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handlePlanSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rule-value">Rule value</Label>
              <Input
                id="rule-value"
                value={ruleValue}
                onChange={(e) => setRuleValue(e.target.value)}
                placeholder={
                  source.agentId === "openai-codex"
                    ? "workspace-write"
                    : source.agentId === "cursor"
                      ? "Shell(rm)"
                      : "Bash(rm *)"
                }
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setPlanSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!ruleValue.trim()}>
                Preview change
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export { FileDetail };
