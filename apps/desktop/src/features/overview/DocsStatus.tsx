import { adapters } from "@arbiter/core";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

export function DocsStatus() {
  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Documentation Status</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Manual documentation checks are not wired to network access. Normal app use remains offline.
      </p>
      <Card>
        <CardContent className="pt-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Agent</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Adapter</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Docs reviewed</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {adapters.map((adapter) => (
                <tr key={adapter.id} className="border-b border-zinc-50 dark:border-zinc-900 last:border-0">
                  <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300">{adapter.displayName}</td>
                  <td className="py-3 px-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">{adapter.adapterVersion}</td>
                  <td className="py-3 px-3 text-zinc-500 dark:text-zinc-400">{adapter.docsReviewedAt}</td>
                  <td className="py-3 px-3">
                    <Badge variant="muted">unchecked</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
