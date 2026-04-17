import * as React from "react";
import type { AgentExtensionConfig, AgentSummary } from "@arbiter/core";
import { Badge } from "../ui/badge";
import { StatusPill } from "../ui/status-pill";
import { extensionKindLabels, extensionStatusLabels, sourceScopeLabel } from "../../lib/viewModels";

interface ExtensionMatrixProps {
  summary: AgentSummary;
  onSelectSource: (sourceId: string) => void;
}

function ExtensionMatrix({ summary, onSelectSource }: ExtensionMatrixProps) {
  const sourceById = new Map(summary.sources.map((source) => [source.id, source]));

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Surface
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Status
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Locations
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.extensions.map((extension, index) => (
            <ExtensionRow
              key={extension.id}
              extension={extension}
              isLast={index === summary.extensions.length - 1}
              sourceById={sourceById}
              onSelectSource={onSelectSource}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExtensionRow({
  extension,
  isLast,
  sourceById,
  onSelectSource
}: {
  extension: AgentExtensionConfig;
  isLast: boolean;
  sourceById: Map<string, AgentSummary["sources"][number]>;
  onSelectSource: (sourceId: string) => void;
}) {
  const tone = extension.status === "configured" ? "warn" : extension.status === "unsupported" ? "muted" : "muted";
  const sourceIds = extension.sourceIds.filter((sourceId) => sourceById.has(sourceId));

  return (
    <tr className={isLast ? "" : "border-b border-zinc-100 dark:border-zinc-800"}>
      <td className="px-4 py-3 align-top">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{extension.label}</span>
            <Badge variant="secondary">{extensionKindLabels[extension.kind]}</Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{extension.configuration}</p>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <StatusPill tone={tone}>{extensionStatusLabels[extension.status]}</StatusPill>
        <p className="mt-1 text-xs capitalize text-zinc-400">{extension.confidence}</p>
      </td>
      <td className="px-4 py-3 align-top">
        {sourceIds.length > 0 ? (
          <div className="space-y-1.5">
            {sourceIds.map((sourceId) => {
              const source = sourceById.get(sourceId);
              if (!source) return null;
              return (
                <button
                  key={sourceId}
                  type="button"
                  onClick={() => onSelectSource(sourceId)}
                  className="block max-w-[240px] text-left font-mono text-xs text-[#1d7f68] hover:underline dark:text-emerald-400"
                >
                  <span className="font-sans text-zinc-500 dark:text-zinc-400">{sourceScopeLabel(source)}: </span>
                  <span className="break-all">{source.path}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-zinc-400">No configured source</span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="max-w-[260px] space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          {extension.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </td>
    </tr>
  );
}

export { ExtensionMatrix };
