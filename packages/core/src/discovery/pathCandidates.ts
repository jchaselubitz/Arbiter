import { claudeAdapter } from "../adapters/claude/adapter";
import { codexAdapter } from "../adapters/codex/adapter";
import { cursorAdapter } from "../adapters/cursor/adapter";
import type { AgentAdapter, DiscoveryContext } from "../adapters/types";
import type { SourceFile } from "../model/source";

export const adapters: AgentAdapter[] = [claudeAdapter, codexAdapter, cursorAdapter];

export function getCandidateSources(context: DiscoveryContext): SourceFile[] {
  return adapters.flatMap((adapter) => adapter.discover(context));
}

export function getAdapterForSource(sourceId: string): AgentAdapter | undefined {
  return adapters.find((adapter) => sourceId.startsWith(`${adapter.id}:`));
}
