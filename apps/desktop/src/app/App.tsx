import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AgentId } from "@agent-permissions-editor/core";
import { adapters } from "@agent-permissions-editor/core";
import { AppShell } from "../components/layout/AppShell";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AgentDetail } from "../features/agent-detail/AgentDetail";
import { Backups } from "../features/backups/Backups";
import { ChangeReview } from "../features/change-review/ChangeReview";
import { FileDetail } from "../features/file-detail/FileDetail";
import { DocsStatus } from "../features/overview/DocsStatus";
import { Overview } from "../features/overview/Overview";
import { Settings } from "../features/settings/Settings";
import { useWorkspaceStore } from "../stores/useWorkspaceStore";
import { useEditorStore } from "../stores/useEditorStore";
import { useUIStore, initTheme } from "../stores/useUIStore";
import { useShortcuts } from "../lib/shortcuts";
import { getRuntimeContext } from "../lib/tauriClient";
import type { RouteId } from "./routes";

export function App() {
  const { result, repoPath, selectedAgentId, backups, hydrationStatus, error, rehydrate, chooseRepo, selectAgent } = useWorkspaceStore();
  const { plan, saving, error: editorError, selectSource, planEdit, confirmWrite, discardPlan } = useEditorStore();
  const { route, setRoute, recentRepos, addRecentRepo, setLastAgentForRepo } = useUIStore();

  // Platform detection for vibrancy/traffic-lights
  const [platform, setPlatform] = useState<string | null>(null);

  // Init theme and boot; detect platform
  useEffect(() => {
    initTheme();
    void rehydrate(null);
    getRuntimeContext()
      .then((ctx) => setPlatform(ctx.platform))
      .catch(() => {});
  }, []);

  // Show error toasts
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);
  useEffect(() => {
    if (editorError) toast.error(editorError);
  }, [editorError]);

  // Track repo in recents
  useEffect(() => {
    if (repoPath) addRecentRepo(repoPath);
  }, [repoPath]);

  // Persist last agent per repo
  useEffect(() => {
    if (repoPath && selectedAgentId) {
      setLastAgentForRepo(repoPath, selectedAgentId);
    }
  }, [repoPath, selectedAgentId]);

  const summaries = useMemo(() => result?.summaries ?? [], [result]);
  const selectedSummary = useMemo(
    () => summaries.find((s) => s.agentId === selectedAgentId) ?? summaries[0] ?? null,
    [summaries, selectedAgentId]
  );
  // ⌘1–⌘6 agent shortcuts
  const detectedAdapters = useMemo(
    () => adapters.filter((a) => summaries.some((s) => s.agentId === a.id && s.status !== "not-found")),
    [summaries]
  );
  useShortcuts(
    detectedAdapters.slice(0, 6).map((adapter, i) => ({
      key: String(i + 1),
      meta: true,
      handler: () => {
        selectAgent(adapter.id as AgentId);
        if (route === "files" || route === "change-review") setRoute("agents");
      }
    })),
    [detectedAdapters, route]
  );

  // ⌘\ toggle sidebar
  useShortcuts(
    [{ key: "\\", meta: true, handler: () => useUIStore.getState().toggleSidebar() }],
    []
  );

  function handleSelectAgent(agentId: AgentId) {
    selectAgent(agentId);
    // Sticky route: stay on same screen, but drop file/change-review if not applicable
    if (route === "files" || route === "change-review" || route === "backups") {
      setRoute("agents");
    }
  }

  async function handleChooseRepo() {
    await chooseRepo();
    setRoute("overview");
  }

  function handleSelectRecent(path: string) {
    void rehydrate(path);
    setRoute("overview");
  }

  function renderRoute() {
    const loading = hydrationStatus === "loading";

    switch (route) {
      case "overview":
        return (
          <Overview
            result={result}
            repoPath={repoPath}
            loading={loading}
            onSelectAgent={(id) => { handleSelectAgent(id); setRoute("agents"); }}
            onChooseRepo={handleChooseRepo}
          />
        );
      case "agents":
        return (
          <AgentDetail
            summary={selectedSummary}
            onSelectSource={(sourceId) => {
              selectSource(sourceId);
              setRoute("files");
            }}
            onNavigateHome={() => setRoute("overview")}
          />
        );
      case "files": {
        const source = result?.sources.find((s) => s.id === useEditorStore.getState().selectedSourceId) ?? null;
        return (
          <FileDetail
            result={result}
            source={source}
            onPlan={(src, intent, value, label) => {
              planEdit(src, intent, value, label);
              setRoute("change-review");
            }}
            onNavigateAgent={() => setRoute("agents")}
            onNavigateHome={() => setRoute("overview")}
            agentDisplayName={selectedSummary?.displayName}
          />
        );
      }
      case "change-review":
        return (
          <ChangeReview
            plan={plan}
            saving={saving}
            error={editorError}
            onWrite={async () => {
              await confirmWrite();
              setRoute("backups");
            }}
            onDiscard={() => {
              discardPlan();
              setRoute("files");
            }}
            onNavigateHome={() => setRoute("overview")}
          />
        );
      case "backups":
        return (
          <Backups
            backups={backups}
            onNavigateHome={() => setRoute("overview")}
          />
        );
      case "docs":
        return <DocsStatus />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  }

  return (
    <ErrorBoundary>
      <AppShell
        repoPath={repoPath}
        recentRepos={recentRepos}
        summaries={summaries}
        selectedAgentId={selectedAgentId}
        route={route}
        onRoute={(r: RouteId) => setRoute(r)}
        onChooseRepo={handleChooseRepo}
        onSelectRecent={handleSelectRecent}
        onSelectAgent={handleSelectAgent}
        platform={platform ?? undefined}
      >
        <ErrorBoundary>
          {renderRoute()}
        </ErrorBoundary>
      </AppShell>
    </ErrorBoundary>
  );
}

