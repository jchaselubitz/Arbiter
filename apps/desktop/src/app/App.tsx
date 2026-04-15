import { useEffect, useMemo, useState } from "react";
import {
  analyzeSources,
  createDiscoveryContext,
  getCandidateSources,
  planSourceChange,
  summarizeDiff,
  type BackupRecord,
  type ChangePlan,
  type DiscoveryContext,
  type DiscoveryResult,
  type SourceFile
} from "@agent-permissions-editor/core";
import { AppShell } from "../components/layout/AppShell";
import { AgentDetail } from "../features/agent-detail/AgentDetail";
import { Backups } from "../features/backups/Backups";
import { ChangeReview } from "../features/change-review/ChangeReview";
import { FileDetail } from "../features/file-detail/FileDetail";
import { DocsStatus } from "../features/overview/DocsStatus";
import { Overview } from "../features/overview/Overview";
import type { RouteId } from "./routes";
import { chooseRepository, getRuntimeContext, hydrateSources, listBackups, readCandidateFiles, sha256Text, writePermissionFile } from "../lib/tauriClient";

export function App() {
  const [route, setRoute] = useState<RouteId>("overview");
  const [context, setContext] = useState<DiscoveryContext | null>(null);
  const [repoPath, setRepoPath] = useState<string | null>(null);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [plan, setPlan] = useState<ChangePlan | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void boot(null);
  }, []);

  const selectedSummary = useMemo(() => result?.summaries.find((summary) => summary.agentId === selectedAgentId) ?? result?.summaries[0] ?? null, [result, selectedAgentId]);
  const selectedSource = useMemo(() => result?.sources.find((source) => source.id === selectedSourceId) ?? null, [result, selectedSourceId]);

  async function boot(nextRepoPath: string | null) {
    setError(null);
    try {
      const runtime = await getRuntimeContext();
      const nextContext = createDiscoveryContext({ homeDir: runtime.homeDir, repoPath: nextRepoPath, platform: runtime.platform });
      const candidates = getCandidateSources(nextContext);
      const states = await readCandidateFiles(candidates.map((source) => source.path));
      const hydrated = hydrateSources(candidates, states);
      const nextResult = analyzeSources(nextContext, hydrated);
      setContext(nextContext);
      setRepoPath(nextRepoPath);
      setResult(nextResult);
      setSelectedAgentId((current) => current ?? nextResult.summaries[0]?.agentId ?? null);
      setBackups(await listBackups());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleChooseRepo() {
    const selected = await chooseRepository();
    if (selected) {
      await boot(selected);
      setRoute("overview");
    }
  }

  function handleSelectAgent(agentId: string) {
    setSelectedAgentId(agentId);
    setRoute("agents");
  }

  function handleSelectSource(sourceId: string) {
    setSelectedSourceId(sourceId);
    setRoute("files");
  }

  function handlePlan(source: SourceFile) {
    if (!result) return;
    const intent = source.agentId === "openai-codex" ? "set-default-mode" : "add-deny-rule";
    const suggested = source.agentId === "cursor" ? "Shell(rm)" : source.agentId === "claude-code" ? "Bash(rm *)" : "workspace-write";
    const value = window.prompt("Rule or value to write", suggested);
    if (!value) return;
    const nextPlan = planSourceChange(result, {
      sourceId: source.id,
      currentContent: source.content,
      intent,
      value,
      actionLabel: source.agentId === "openai-codex" ? "Create conservative Codex config" : `Add deny rule: ${value}`
    });
    setPlan(nextPlan);
    setRoute("change-review");
  }

  async function handleWrite() {
    if (!plan || !context) return;
    setSaving(true);
    setError(null);
    try {
      const beforeHash = await sha256Text(plan.before);
      await writePermissionFile({
        path: plan.path,
        beforeHash,
        before: plan.before,
        after: plan.after,
        repoPath,
        backup: {
          adapterId: plan.agentId,
          adapterVersion: result?.sources.find((source) => source.id === plan.sourceId)?.adapterVersion ?? "0.1.0",
          originalPath: plan.path,
          before: plan.before,
          after: plan.after,
          actionLabel: plan.actionLabel,
          diffSummary: summarizeDiff(plan.diff)
        }
      });
      setPlan(null);
      await boot(context.repoPath);
      setRoute("backups");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function renderRoute() {
    if (route === "overview") return <Overview result={result} repoPath={repoPath} onSelectAgent={handleSelectAgent} />;
    if (route === "agents") return <AgentDetail summary={selectedSummary} onSelectSource={handleSelectSource} />;
    if (route === "files") return <FileDetail result={result} source={selectedSource} onPlan={handlePlan} />;
    if (route === "change-review") return <ChangeReview plan={plan} saving={saving} error={error} onWrite={handleWrite} />;
    if (route === "backups") return <Backups backups={backups} />;
    if (route === "docs") return <DocsStatus />;
    return (
      <section className="stack">
        <h2>Settings</h2>
        <p>Normal use is local-only. Manual documentation checks and external editor integration are intentionally not enabled in this MVP.</p>
        {error ? <p className="error">{error}</p> : null}
      </section>
    );
  }

  return (
    <AppShell route={route} repoPath={repoPath} onRoute={setRoute} onChooseRepo={handleChooseRepo}>
      {error && route !== "change-review" ? <p className="error banner">{error}</p> : null}
      {renderRoute()}
    </AppShell>
  );
}
