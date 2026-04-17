import * as React from "react";
import { useState } from "react";
import type { DiscoveryResult, SourceFile, PermissionIntent } from "@arbiter/core";
import { AlertCircle, FileCode2 } from "lucide-react";
import { StatusPill } from "../../components/ui/status-pill";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../components/ui/sheet";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "../../components/ui/tooltip";
import { sourceLabel, sourceScopeLabel, rulesForSource } from "../../lib/viewModels";
import { OpenInFinderButton } from "../../components/file/OpenInFinderButton";

type RuleEffect = "deny" | "allow";
type CodexMode = "read-only" | "workspace-write" | "danger-full-access";

const EXAMPLES: Record<string, string[]> = {
  "openai-codex": ["read-only", "workspace-write", "danger-full-access"],
  cursor: ["Shell(rm)", "Shell(curl)", "Shell(git push)"],
  default: ["Bash(rm *)", "Bash(curl:*)", "Read(./.env)"]
};

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
  const [effect, setEffect] = useState<RuleEffect>("deny");

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
  const isCodex = source.agentId === "openai-codex";
  const examples = EXAMPLES[source.agentId] ?? EXAMPLES.default;

  const tone = source.writeSupport === "safe-write" ? "ok" : source.writeSupport === "partial" ? "warn" : "muted";

  const disabledReason = !canEdit
    ? `This file's write support is "${source.writeSupport}" — editing isn't safe here.`
    : null;

  const trimmed = ruleValue.trim();
  const previewText = !trimmed
    ? ""
    : isCodex
      ? `Set default mode to "${trimmed}" in ${basename}`
      : `Add ${effect} rule \`${trimmed}\` to ${basename}`;

  function handlePlanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    const intent: PermissionIntent = isCodex
      ? "set-default-mode"
      : effect === "allow"
        ? "add-allow-rule"
        : "add-deny-rule";
    const actionLabel = isCodex
      ? `Set default mode: ${trimmed}`
      : `Add ${effect} rule: ${trimmed}`;
    onPlan(source!, intent, trimmed, actionLabel);
    setPlanSheetOpen(false);
    setRuleValue("");
    setEffect("deny");
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
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={disabledReason ? 0 : -1}>
                  <Button
                    size="sm"
                    onClick={() => setPlanSheetOpen(true)}
                    disabled={!canEdit}
                    aria-disabled={!canEdit}
                  >
                    {isCodex ? "Change mode" : "Add rule"}
                  </Button>
                </span>
              </TooltipTrigger>
              {disabledReason && (
                <TooltipContent side="bottom" className="max-w-xs">
                  {disabledReason}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
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
              className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${d.severity === "error"
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

      {/* Add rule sheet */}
      <Sheet open={planSheetOpen} onOpenChange={setPlanSheetOpen}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>{isCodex ? "Change default mode" : "Add rule"}</SheetTitle>
            <SheetDescription>
              {isCodex
                ? <>Set the default sandbox mode in <code className="font-mono text-xs">{basename}</code>.</>
                : <>Stage a new rule for <code className="font-mono text-xs">{basename}</code>. You&apos;ll preview the exact diff before writing.</>}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handlePlanSubmit} className="mt-6 space-y-5">
            {!isCodex && (
              <div className="space-y-1.5">
                <Label>Effect</Label>
                <div className="flex gap-2">
                  {(["deny", "allow"] as RuleEffect[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setEffect(opt)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize transition-colors ${
                        effect === opt
                          ? opt === "deny"
                            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                            : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {effect === "deny"
                    ? "Block the agent from running matching commands."
                    : "Allow matching commands without prompting."}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="rule-value">{isCodex ? "Mode" : "Pattern"}</Label>
              <Input
                id="rule-value"
                value={ruleValue}
                onChange={(e) => setRuleValue(e.target.value)}
                placeholder={examples[0]}
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 self-center mr-1">Examples:</span>
                {examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setRuleValue(ex)}
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {previewText && (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <span className="font-semibold">Preview: </span>
                {previewText}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setPlanSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!trimmed}>
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
