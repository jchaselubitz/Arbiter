import { create } from "zustand";
import type { BackupRecord, ChangePlan, SourceFile } from "@agent-permissions-editor/core";
import type { PermissionIntent } from "@agent-permissions-editor/core";
import { planSourceChange, summarizeDiff } from "@agent-permissions-editor/core";
import { sha256Text, writePermissionFile } from "../lib/tauriClient";
import { useWorkspaceStore } from "./useWorkspaceStore";

interface EditorState {
  selectedSourceId: string | null;
  plan: ChangePlan | null;
  saving: boolean;
  error: string | null;
}

interface EditorActions {
  selectSource: (sourceId: string | null) => void;
  planEdit: (source: SourceFile, intent: PermissionIntent, value: string, actionLabel: string) => void;
  confirmWrite: () => Promise<void>;
  discardPlan: () => void;
  restoreBackup: (backup: BackupRecord) => Promise<void>;
}

export const useEditorStore = create<EditorState & EditorActions>()((set, get) => ({
  selectedSourceId: null,
  plan: null,
  saving: false,
  error: null,

  selectSource: (sourceId) => {
    set({ selectedSourceId: sourceId });
  },

  planEdit: (source: SourceFile, intent: PermissionIntent, value: string, actionLabel: string) => {
    const { result } = useWorkspaceStore.getState();
    if (!result) return;
    const nextPlan = planSourceChange(result, {
      sourceId: source.id,
      currentContent: source.content,
      intent,
      value,
      actionLabel
    });
    set({ plan: nextPlan });
  },

  confirmWrite: async () => {
    const { plan } = get();
    const { context, result, rehydrate } = useWorkspaceStore.getState();
    if (!plan || !context) return;
    set({ saving: true, error: null });
    try {
      const beforeHash = await sha256Text(plan.before);
      await writePermissionFile({
        path: plan.path,
        beforeHash,
        before: plan.before,
        after: plan.after,
        repoPath: context.repoPath,
        backup: {
          adapterId: plan.agentId,
          adapterVersion: result?.sources.find((s) => s.id === plan.sourceId)?.adapterVersion ?? "0.1.0",
          originalPath: plan.path,
          before: plan.before,
          after: plan.after,
          actionLabel: plan.actionLabel,
          diffSummary: summarizeDiff(plan.diff)
        }
      });
      set({ plan: null, saving: false });
      await rehydrate();
    } catch (err) {
      set({ saving: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  discardPlan: () => {
    set({ plan: null, error: null });
  },

  restoreBackup: async (_backup: BackupRecord) => {
    // Future: implement restore from backup
    set({ error: "Restore from backup is not yet implemented." });
  }
}));
