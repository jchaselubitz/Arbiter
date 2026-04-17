import { create } from "zustand";
import type { BackupRecord, ChangePlan, SourceFile } from "@arbiter/core";
import type { AgentId, PermissionIntent } from "@arbiter/core";
import { planSourceChange, summarizeDiff } from "@arbiter/core";
import { sha256Text, writePermissionFile } from "../lib/tauriClient";
import {
  getPermittedBashCommandTarget,
  permittedBashCommandLabel,
  permittedBashCommandValue,
} from "../lib/permittedBashCommands";
import { useWorkspaceStore } from "./useWorkspaceStore";

interface EditorState {
  selectedSourceId: string | null;
  plan: ChangePlan | null;
  plans: ChangePlan[];
  saving: boolean;
  error: string | null;
}

interface EditorActions {
  selectSource: (sourceId: string | null) => void;
  planEdit: (
    source: SourceFile,
    intent: PermissionIntent,
    value: string,
    actionLabel: string,
  ) => void;
  planPermittedBashCommand: (agentIds: AgentId[], command: string) => void;
  planPermittedBashCommands: (
    agentIds: AgentId[],
    commands: string[],
    label: string,
  ) => void;
  confirmWrite: () => Promise<void>;
  discardPlan: () => void;
  restoreBackup: (backup: BackupRecord) => Promise<void>;
}

export const useEditorStore = create<EditorState & EditorActions>()(
  (set, get) => ({
    selectedSourceId: null,
    plan: null,
    plans: [],
    saving: false,
    error: null,

    selectSource: (sourceId) => {
      set({ selectedSourceId: sourceId });
    },

    planEdit: (
      source: SourceFile,
      intent: PermissionIntent,
      value: string,
      actionLabel: string,
    ) => {
      const { result } = useWorkspaceStore.getState();
      if (!result) return;
      const nextPlan = planSourceChange(result, {
        sourceId: source.id,
        currentContent: source.content,
        intent,
        value,
        actionLabel,
      });
      set({ plan: nextPlan, plans: [nextPlan], error: null });
    },

    planPermittedBashCommand: (agentIds: AgentId[], command: string) => {
      get().planPermittedBashCommands(agentIds, [command], "Custom command");
    },

    planPermittedBashCommands: (
      agentIds: AgentId[],
      commands: string[],
      label: string,
    ) => {
      const { result } = useWorkspaceStore.getState();
      if (!result) return;
      const trimmedCommands = commands
        .map((command) => command.trim())
        .filter(Boolean);
      const contentBySourceId = new Map<string, string | null>();
      const nextPlans = agentIds.flatMap((agentId) => {
        const summary = result.summaries.find(
          (item) => item.agentId === agentId,
        );
        const source = summary ? getPermittedBashCommandTarget(summary) : null;
        if (!summary || !source) {
          throw new Error(
            `No writable settings file is available for ${permittedBashCommandLabel(agentId)}.`,
          );
        }
        return trimmedCommands.map((command) => {
          const value = permittedBashCommandValue(agentId, command);
          const currentContent = contentBySourceId.has(source.id)
            ? contentBySourceId.get(source.id)!
            : source.content;
          const nextPlan = planSourceChange(result, {
            sourceId: source.id,
            currentContent,
            intent: "add-allow-rule",
            value,
            actionLabel: `Permit ${label} for ${permittedBashCommandLabel(agentId)}: ${command}`,
          });
          if (nextPlan.ok) contentBySourceId.set(source.id, nextPlan.after);
          return nextPlan;
        });
      });
      set({ plan: nextPlans[0] ?? null, plans: nextPlans, error: null });
    },

    confirmWrite: async () => {
      const { plan, plans } = get();
      const { context, result, rehydrate } = useWorkspaceStore.getState();
      const pendingPlans = plans.length > 0 ? plans : plan ? [plan] : [];
      if (pendingPlans.length === 0 || !context) return;
      set({ saving: true, error: null });
      try {
        for (const nextPlan of pendingPlans) {
          const beforeHash = await sha256Text(nextPlan.before);
          await writePermissionFile({
            path: nextPlan.path,
            beforeHash,
            before: nextPlan.before,
            after: nextPlan.after,
            repoPath: context.repoPath,
            backup: {
              adapterId: nextPlan.agentId,
              adapterVersion:
                result?.sources.find((s) => s.id === nextPlan.sourceId)
                  ?.adapterVersion ?? "0.1.0",
              originalPath: nextPlan.path,
              before: nextPlan.before,
              after: nextPlan.after,
              actionLabel: nextPlan.actionLabel,
              diffSummary: summarizeDiff(nextPlan.diff),
            },
          });
        }
        set({ plan: null, plans: [], saving: false });
        await rehydrate();
      } catch (err) {
        set({
          saving: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },

    discardPlan: () => {
      set({ plan: null, plans: [], error: null });
    },

    restoreBackup: async (_backup: BackupRecord) => {
      // Future: implement restore from backup
      set({ error: "Restore from backup is not yet implemented." });
    },
  }),
);
