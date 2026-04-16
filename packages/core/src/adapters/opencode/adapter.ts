import type { AgentAdapter, AgentSummary, DiscoveryContext, ParsedSource } from "../types";
import type { ChangePlan, PlanChangeInput } from "../../model/change";
import type { SourceFile } from "../../model/source";
import { effectiveFromRules, unsupportedExtension } from "../common";

const adapterVersion = "0.1.0";
const docsReviewedAt = "2026-04-16";

export const opencodeAdapter: AgentAdapter = {
  id: "opencode",
  displayName: "OpenCode",
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
      agentId: "opencode",
      displayName: "OpenCode",
      status: "not-found",
      sources: [],
      rules: [],
      effective: this.computeEffective([]),
      diagnostics: [],
      unknownCount: 0,
      highRiskFindings: [],
      extensions: [
        unsupportedExtension("opencode", "skills", "OpenCode skills", "OpenCode skill configuration is not modeled by this adapter."),
        unsupportedExtension("opencode", "plugins", "OpenCode plugins", "OpenCode plugin configuration is not modeled by this adapter.")
      ]
    };
  },
  computeEffective(rules) {
    return effectiveFromRules("opencode", rules);
  },
  getSupportedIntents() {
    return [];
  },
  planChange(input: PlanChangeInput, source: SourceFile): ChangePlan {
    const before = source.content ?? "";
    return { ok: false, agentId: "opencode", sourceId: source.id, path: source.path, actionLabel: input.actionLabel, before, after: before, diff: "No changes.", willCreate: false, warnings: ["OpenCode adapter does not support writes yet."], diagnostics: [] };
  }
};
