import type { Diagnostic } from "../model/diagnostics";

export interface JsonParseResult {
  value: unknown;
  diagnostics: Diagnostic[];
  hasComments: boolean;
}

export function detectJsonComments(content: string): boolean {
  return /(^|[^:])\/\/|\/\*/.test(content);
}

export function stripJsonComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

export function parseJsonLike(content: string, path: string): JsonParseResult {
  const hasComments = detectJsonComments(content);
  try {
    return {
      value: JSON.parse(hasComments ? stripJsonComments(content) : content),
      diagnostics: hasComments
        ? [{ severity: "info", message: "JSON comments were detected. This file is read-only until comment-preserving writes are available.", path, code: "jsonc-comments" }]
        : [],
      hasComments
    };
  } catch (error) {
    return {
      value: null,
      diagnostics: [{ severity: "error", message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`, path, code: "invalid-json" }],
      hasComments
    };
  }
}

export function formatJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function getObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}
