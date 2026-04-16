import * as React from "react";
import * as DiffLib from "diff";
import { cn } from "../../lib/cn";

interface DiffViewProps {
  before: string;
  after: string;
  className?: string;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNum?: number;
}

function parseDiff(before: string, after: string): DiffLine[] {
  const changes = DiffLib.diffLines(before, after);
  const lines: DiffLine[] = [];
  let lineNum = 1;
  for (const change of changes) {
    const content = change.value.endsWith("\n") ? change.value.slice(0, -1) : change.value;
    const parts = content.split("\n");
    for (const part of parts) {
      if (change.added) {
        lines.push({ type: "added", content: part, lineNum: lineNum++ });
      } else if (change.removed) {
        lines.push({ type: "removed", content: part });
      } else {
        lines.push({ type: "unchanged", content: part, lineNum: lineNum++ });
      }
    }
  }
  return lines;
}

function DiffView({ before, after, className }: DiffViewProps) {
  const lines = React.useMemo(() => parseDiff(before, after), [before, after]);

  return (
    <div
      className={cn(
        "overflow-auto rounded-lg border border-zinc-200 bg-zinc-950 font-mono text-xs dark:border-zinc-700",
        className
      )}
      aria-label="File diff"
    >
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => (
            <tr
              key={i}
              className={cn(
                line.type === "added" && "bg-emerald-950/50",
                line.type === "removed" && "bg-red-950/50"
              )}
            >
              <td
                className={cn(
                  "select-none border-r px-3 py-0.5 text-right text-zinc-600 w-12",
                  line.type === "added" && "border-emerald-900 text-emerald-600",
                  line.type === "removed" && "border-red-900 text-red-600",
                  line.type === "unchanged" && "border-zinc-800"
                )}
                aria-hidden
              >
                {line.lineNum ?? ""}
              </td>
              <td
                className={cn(
                  "pl-3 pr-4 py-0.5 whitespace-pre",
                  line.type === "added" && "text-emerald-300",
                  line.type === "removed" && "text-red-300",
                  line.type === "unchanged" && "text-zinc-300"
                )}
              >
                <span
                  className={cn(
                    "mr-2 select-none",
                    line.type === "added" && "text-emerald-500",
                    line.type === "removed" && "text-red-500",
                    line.type === "unchanged" && "text-zinc-700"
                  )}
                  aria-hidden
                >
                  {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
                </span>
                {line.content}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { DiffView };
