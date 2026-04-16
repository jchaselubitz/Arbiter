import * as React from "react";
import type { ChangePlan } from "@agent-permissions-editor/core";
import { AlertTriangle, AlertCircle, CheckCircle2, GitCommit } from "lucide-react";
import { DiffView } from "../../components/diff/DiffView";
import { Button } from "../../components/ui/button";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import { Kbd } from "../../components/ui/kbd";
import { useShortcuts } from "../../lib/shortcuts";

interface ChangeReviewProps {
  plan: ChangePlan | null;
  saving: boolean;
  error: string | null;
  onWrite: () => void;
  onDiscard: () => void;
  onNavigateHome: () => void;
}

function ChangeReview({ plan, saving, error, onWrite, onDiscard, onNavigateHome }: ChangeReviewProps) {
  useShortcuts(
    plan && plan.ok
      ? [{ key: "Enter", meta: true, handler: () => onWrite() }]
      : [],
    [plan, onWrite]
  );

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-16">
        <GitCommit className="h-10 w-10 text-zinc-300" aria-hidden />
        <p className="text-zinc-500 dark:text-zinc-400">No pending change. Choose "Plan edit" from a file detail page.</p>
      </div>
    );
  }

  const basename = plan.path.split("/").at(-1) ?? plan.path;

  return (
    <div className="p-6 space-y-5 max-w-4xl">
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
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{plan.actionLabel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={onDiscard} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onWrite} disabled={!plan.ok || saving}>
            {saving ? "Writing…" : plan.willCreate ? "Create file" : "Back up & write"}
            {!saving && <Kbd>⌘↵</Kbd>}
          </Button>
        </div>
      </div>

      {/* File path */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">File</p>
        <code className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{plan.path}</code>
        {plan.willCreate && (
          <span className="ml-2 text-xs text-[#1d7f68] dark:text-[#3dd6aa]">(new file)</span>
        )}
      </div>

      {/* Warnings */}
      {plan.warnings.map((warning) => (
        <div
          key={warning}
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden />
          <p className="text-sm text-amber-700 dark:text-amber-300">{warning}</p>
        </div>
      ))}

      {/* Diagnostics */}
      {plan.diagnostics.map((d) => (
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
      <section>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Diff — {basename}</h2>
        <DiffView before={plan.before} after={plan.after} />
      </section>

      {/* Sticky confirm bar */}
      <div className="sticky bottom-0 -mx-6 px-6 py-4 border-t border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-950/90 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {plan.ok ? (
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
          <Button onClick={onWrite} disabled={!plan.ok || saving}>
            {saving ? "Writing…" : plan.willCreate ? "Create file" : "Back up & write"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ChangeReview };
