import type { AgentAdapter, AgentSummary, DiscoveryContext, ParsedSource } from "../types";
import type { ChangePlan, PlanChangeInput } from "../../model/change";
import type { SourceFile } from "../../model/source";
import { effectiveFromRules, unsupportedExtension } from "../common";

const adapterVersion = "0.1.0";
const docsReviewedAt = "2026-04-16";

export const antigravityAdapter: AgentAdapter = {
  id: "antigravity",
  displayName: "Antigravity",
  adapterVersion,
  docsReviewedAt,
  docs: [],
  discover(_input: DiscoveryContext): SourceFile[] {
    return [];
  },
  parse(source: SourceFile): ParsedSource {
    return { source, rules: [], diagnostics: [], unknownKeys: [], raw: null };
  },
  summarize(_parsed: ParsedSource[]): AgentSummary {
    return {
      agentId: "antigravity",
      displayName: "Antigravity",
      status: "not-found",
      sources: [],
      rules: [],
      effective: this.computeEffective([]),
      diagnostics: [],
      unknownCount: 0,
      highRiskFindings: [],
      extensions: [
        unsupportedExtension("antigravity", "skills", "Antigravity skills", "Antigravity skill configuration is not modeled by this adapter."),
        unsupportedExtension("antigravity", "plugins", "Antigravity plugins", "Antigravity plugin configuration is not modeled by this adapter.")
      ]
    };
  },
  computeEffective(rules) {
    return effectiveFromRules("antigravity", rules);
  },
  getSupportedIntents() {
    return [];
  },
  planChange(input: PlanChangeInput, source: SourceFile): ChangePlan {
    const before = source.content ?? "";
    return { ok: false, agentId: "antigravity", sourceId: source.id, path: source.path, actionLabel: input.actionLabel, before, after: before, diff: "No changes.", willCreate: false, warnings: ["Antigravity adapter does not support writes yet."], diagnostics: [] };
  }
};
