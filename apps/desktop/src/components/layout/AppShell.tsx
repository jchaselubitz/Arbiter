import * as React from "react";
import { Toaster } from "sonner";
import type { AgentId, AgentSummary, DiscoveryResult } from "@arbiter/core";
import type { RouteId } from "../../app/routes";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { cn } from "../../lib/cn";

interface AppShellProps {
  repoPath: string | null;
  recentRepos: string[];
  summaries: AgentSummary[];
  selectedAgentId: AgentId | null;
  result: DiscoveryResult | null;
  route: RouteId;
  onRoute: (route: RouteId) => void;
  onGoBack: () => void;
  canGoBack: boolean;
  onChooseRepo: () => void;
  onSelectRecent: (path: string) => void;
  onSelectAgent: (agentId: AgentId) => void;
  onPermitBashCommands: (agentIds: AgentId[], commands: string[], label: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  platform?: string;
  children: React.ReactNode;
}

function AppShell({
  repoPath,
  recentRepos,
  summaries,
  selectedAgentId,
  result,
  route,
  onRoute,
  onGoBack,
  canGoBack,
  onChooseRepo,
  onSelectRecent,
  onSelectAgent,
  onPermitBashCommands,
  onRefresh,
  isRefreshing,
  platform,
  children
}: AppShellProps) {
  return (
    <div
      className="app-root"
      data-platform={platform}
    >
      <AppHeader
        repoPath={repoPath}
        recentRepos={recentRepos}
        summaries={summaries}
        selectedAgentId={selectedAgentId}
        result={result}
        onChooseRepo={onChooseRepo}
        onSelectRecent={onSelectRecent}
        onSelectAgent={onSelectAgent}
        onGoBack={onGoBack}
        canGoBack={canGoBack}
        onPermitBashCommands={onPermitBashCommands}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        platform={platform}
      />
      <div className="flex flex-1 min-h-0">
        <AppSidebar route={route} onRoute={onRoute} />
        <main
          id="main-content"
          className={cn(
            "flex-1 min-w-0 overflow-auto bg-zinc-50 dark:bg-zinc-950"
          )}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
      <Toaster position="bottom-left" richColors closeButton />
    </div>
  );
}

export { AppShell };
