import type { AgentSummary, DiscoveryContext, ParsedSource } from "../adapters/types";
import type { ChangePlan, PlanChangeInput } from "../model/change";
import type { SourceFile } from "../model/source";
import { adapters, getAdapterForSource, getCandidateSources } from "./pathCandidates";

export interface DiscoveryResult {
  context: DiscoveryContext;
  sources: SourceFile[];
  parsedSources: ParsedSource[];
  summaries: AgentSummary[];
  highRiskFindings: string[];
}

export function analyzeSources(context: DiscoveryContext, hydratedSources: SourceFile[]): DiscoveryResult {
  const byId = new Map(hydratedSources.map((source) => [source.id, source]));
  const candidates = getCandidateSources(context).map((source) => byId.get(source.id) ?? source);
  const parsedSources = candidates.map((source) => {
    const adapter = getAdapterForSource(source.id);
    if (!adapter) throw new Error(`No adapter for source ${source.id}`);
    return adapter.parse(source);
  });
  const summaries = adapters.map((adapter) => adapter.summarize(parsedSources.filter((source) => source.source.agentId === adapter.id)));
  return {
    context,
    sources: parsedSources.map((source) => source.source),
    parsedSources,
    summaries,
    highRiskFindings: summaries.flatMap((summary) => summary.highRiskFindings)
  };
}

export function planSourceChange(result: DiscoveryResult, input: PlanChangeInput): ChangePlan {
  const source = result.sources.find((item) => item.id === input.sourceId);
  if (!source) throw new Error(`Unknown source ${input.sourceId}`);
  const adapter = getAdapterForSource(source.id);
  if (!adapter) throw new Error(`No adapter for source ${source.id}`);
  return adapter.planChange(input, source);
}
