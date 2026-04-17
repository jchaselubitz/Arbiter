import * as React from "react";
import type { AgentSummary, EffectivePermission } from "@arbiter/core";
import { Info } from "lucide-react";
import { StatusPill } from "../ui/status-pill";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { capabilityLabels, effectiveRows } from "../../lib/viewModels";

interface PermissionMatrixProps {
  summary: AgentSummary;
}

function PermissionMatrix({ summary }: PermissionMatrixProps) {
  const rows = effectiveRows(summary);

  return (
    <TooltipProvider>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Capability
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Status
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Confidence
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <PermissionRow key={`${summary.agentId}-${row.capability}`} row={row} isLast={i === rows.length - 1} />
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}

function PermissionRow({ row, isLast }: { row: EffectivePermission; isLast: boolean }) {
  const tone = row.status === "denied"
    ? "ok"
    : row.status === "unknown"
      ? "muted"
      : row.status === "allowed" || row.status === "partially-allowed"
        ? "warn"
        : "muted";

  return (
    <tr className={isLast ? "" : "border-b border-zinc-100 dark:border-zinc-800"}>
      <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
        {capabilityLabels[row.capability]}
      </td>
      <td className="px-4 py-3">
        <StatusPill tone={tone}>{row.status}</StatusPill>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{row.confidence}</span>
      </td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 max-w-[260px]">
        <div className="flex items-start gap-1.5">
          <span className="text-xs line-clamp-2">{row.explanation}</span>
          {row.caveats && row.caveats.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="shrink-0" aria-label="View caveats">
                  <Info className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {row.caveats.join(" ")}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </td>
    </tr>
  );
}

export { PermissionMatrix };
