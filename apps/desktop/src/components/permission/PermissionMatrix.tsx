import type { AgentSummary } from "@agent-permissions-editor/core";
import { capabilityLabels, effectiveRows } from "../../lib/viewModels";
import { StatusPill } from "../ui/StatusPill";

export function PermissionMatrix({ summary }: { summary: AgentSummary }) {
  return (
    <table className="matrix">
      <thead>
        <tr>
          <th>Capability</th>
          <th>Status</th>
          <th>Confidence</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {effectiveRows(summary).map((row) => (
          <tr key={`${summary.agentId}-${row.capability}`}>
            <td>{capabilityLabels[row.capability]}</td>
            <td><StatusPill tone={row.status === "denied" ? "ok" : row.status === "unknown" ? "muted" : row.status === "allowed" || row.status === "partially-allowed" ? "warn" : "muted"}>{row.status}</StatusPill></td>
            <td>{row.confidence}</td>
            <td>{row.explanation}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
