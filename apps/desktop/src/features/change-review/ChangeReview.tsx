import * as React from "react";
import type { ChangePlan } from "@arbiter/core";
import { AlertTriangle, AlertCircle, CheckCircle2, GitCommit } from "lucide-react";
import { DiffView } from "../../components/diff/DiffView";
import { Button } from "../../components/ui/button";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import { Kbd } from "../../components/ui/kbd";
import { useShortcuts } from "../../lib/shortcuts";
import { OpenInFinderButton } from "../../components/file/OpenInFinderButton";

interface ChangeReviewProps {
  plan: ChangePlan | null;
  plans?: ChangePlan[];
  saving: boolean;
  error: string | null;
  onWrite: () => void;
  onDiscard: () => void;
  onNavigateHome: () => void;
}

function ChangeReview({ plan, plans = [], saving, error, onWrite, onDiscard, onNavigateHome }: ChangeReviewProps) {
  const [activePlanIndex, setActivePlanIndex] = React.useState(0);
  const pendingPlans = plans.length > 0 ? plans : plan ? [plan] : [];
  const activePlan = pendingPlans[Math.min(activePlanIndex, Math.max(pendingPlans.length - 1, 0))] ?? null;
  const canWrite = pendingPlans.length > 0 && pendingPlans.every((item) => item.ok);

  React.useEffect(() => {
    setActivePlanIndex(0);
  }, [pendingPlans.map((item) => `${item.sourceId}:${item.actionLabel}`).join("|")]);

  useShortcuts(
    canWrite
      ? [{ key: "Enter", meta: true, handler: () => onWrite() }]
      : [],
    [canWrite, onWrite]
  );

  if (!activePlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-16">
        <GitCommit className="h-10 w-10 text-zinc-300" aria-hidden />
        <p className="text-zinc-500 dark:text-zinc-400">No pending change. Choose "Plan edit" from a file detail page.</p>
      </div>
    );
  }

  const basename = activePlan.path.split("/").at(-1) ?? activePlan.path;
  const actionLabel = pendingPlans.length === 1
    ? activePlan.actionLabel
    : `${pendingPlans.length} permission changes`;

  return (
    <div className="flex h-full min-h-0 flex-col p-6 space-y-5 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Overview", onClick: onNavigateHome },
          { label: "Change Review" }
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Change Review</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{actionLabel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={onDiscard} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onWrite} disabled={!canWrite || saving}>
            {saving ? "Writing…" : pendingPlans.length > 1 ? "Back up & write all" : activePlan.willCreate ? "Create file" : "Back up & write"}
            {!saving && <Kbd>⌘↵</Kbd>}
          </Button>
        </div>
      </div>

      {pendingPlans.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {pendingPlans.map((nextPlan, index) => (
            <button
              key={`${nextPlan.sourceId}:${index}`}
              type="button"
              onClick={() => setActivePlanIndex(index)}
              className={`rounded-md border px-3 py-2 text-left text-xs ${index === activePlanIndex
                  ? "border-[#1d7f68] bg-[#e9f7f3] text-[#175f4e] dark:border-[#3dd6aa] dark:bg-[#102c25] dark:text-[#9ff0d9]"
                  : "border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
            >
              <span className="block font-medium">{nextPlan.agentId}</span>
              <span className="block max-w-52 truncate font-mono">{nextPlan.path}</span>
            </button>
          ))}
        </div>
      )}

      {/* File path */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">File</p>
            <code className="font-mono text-sm text-zinc-700 dark:text-zinc-300 break-all">{activePlan.path}</code>
            {activePlan.willCreate && (
              <span className="ml-2 text-xs text-[#1d7f68] dark:text-[#3dd6aa]">(new file)</span>
            )}
          </div>
          {!activePlan.willCreate && (
            <OpenInFinderButton path={activePlan.path} className="shrink-0" />
          )}
        </div>
      </div>

      {/* Warnings */}
      {activePlan.warnings.map((warning) => (
        <div
          key={warning}
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden />
          <p className="text-sm text-amber-700 dark:text-amber-300">{warning}</p>
        </div>
      ))}

      {/* Diagnostics */}
      {activePlan.diagnostics.map((d) => (
        <div
          key={d.message}
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" aria-hidden />
          <p className="text-sm text-red-700 dark:text-red-300">{d.message}</p>
        </div>
      ))}

      {/* Write error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" aria-hidden />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Diff viewer */}
      <section className="flex min-h-0 flex-1 flex-col">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Diff — {basename}</h2>
        <DiffView className="h-full min-h-0" before={activePlan.before} after={activePlan.after} />
      </section>

      {/* Sticky confirm bar */}
      <div className="sticky bottom-0 -mx-6 px-6 py-4 border-t border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-950/90 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {canWrite ? (
            <span className="flex items-center gap-1.5 text-[#1d7f68] dark:text-[#3dd6aa]">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Ready to write
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" aria-hidden /> Cannot proceed
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onDiscard} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onWrite} disabled={!canWrite || saving}>
            {saving ? "Writing…" : pendingPlans.length > 1 ? "Back up & write all" : activePlan.willCreate ? "Create file" : "Back up & write"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ChangeReview };
