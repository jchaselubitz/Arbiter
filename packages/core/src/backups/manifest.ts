import type { AgentId } from "../model/agent";

export interface BackupRecord {
  id: string;
  createdAt: string;
  appVersion: string;
  adapterId: AgentId;
  adapterVersion: string;
  originalPath: string;
  backupPath: string;
  contentSha256Before: string;
  contentSha256After: string;
  actionLabel: string;
  diffSummary: string;
}
