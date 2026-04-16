import { create } from "zustand";
import type {
  DiscoveryContext,
  DiscoveryResult,
  BackupRecord
} from "@agent-permissions-editor/core";
import type { AgentId } from "@agent-permissions-editor/core";
import {
  analyzeSources,
  createDiscoveryContext,
  getCandidateSources
} from "@agent-permissions-editor/core";
import {
  chooseRepository,
  getRuntimeContext,
  hydrateSources,
  listBackups,
  readCandidateFiles
} from "../lib/tauriClient";

type HydrationStatus = "idle" | "loading" | "ready" | "error";

interface WorkspaceState {
  repoPath: string | null;
  context: DiscoveryContext | null;
  result: DiscoveryResult | null;
  selectedAgentId: AgentId | null;
  backups: BackupRecord[];
  hydrationStatus: HydrationStatus;
  error: string | null;
}

interface WorkspaceActions {
  chooseRepo: () => Promise<void>;
  rehydrate: (nextRepoPath?: string | null) => Promise<void>;
  selectAgent: (agentId: AgentId) => void;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()((set, get) => ({
  repoPath: null,
  context: null,
  result: null,
  selectedAgentId: null,
  backups: [],
  hydrationStatus: "idle",
  error: null,

  chooseRepo: async () => {
    const selected = await chooseRepository();
    if (selected) {
      await get().rehydrate(selected);
    }
  },

  rehydrate: async (nextRepoPath?: string | null) => {
    const resolvedPath = nextRepoPath !== undefined ? nextRepoPath : get().repoPath;
    set({ hydrationStatus: "loading", error: null });
    try {
      const runtime = await getRuntimeContext();
      const nextContext = createDiscoveryContext({
        homeDir: runtime.homeDir,
        repoPath: resolvedPath,
        platform: runtime.platform
      });
      const candidates = getCandidateSources(nextContext);
      const states = await readCandidateFiles(candidates.map((s) => s.path));
      const hydrated = hydrateSources(candidates, states);
      const nextResult = analyzeSources(nextContext, hydrated);
      const backups = await listBackups();
      const currentAgent = get().selectedAgentId;
      set((s) => ({
        context: nextContext,
        repoPath: resolvedPath ?? null,
        result: nextResult,
        backups,
        hydrationStatus: "ready",
        selectedAgentId: currentAgent ?? (nextResult.summaries[0]?.agentId as AgentId) ?? null,
        error: null
      }));
    } catch (err) {
      set({ hydrationStatus: "error", error: err instanceof Error ? err.message : String(err) });
    }
  },

  selectAgent: (agentId: AgentId) => {
    set({ selectedAgentId: agentId });
  },

  clearError: () => {
    set({ error: null });
  }
}));
