import type { ParsedSource } from "../adapters/types";
import type { Diagnostic } from "../model/diagnostics";

export function validateParsedSources(parsed: ParsedSource[]): Diagnostic[] {
  return parsed.flatMap((source) => source.diagnostics);
}
