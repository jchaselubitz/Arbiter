import type { Diagnostic } from "../model/diagnostics";

export interface TomlParseResult {
  values: Record<string, unknown>;
  diagnostics: Diagnostic[];
}

export function parseTomlLite(content: string, path: string): TomlParseResult {
  const values: Record<string, unknown> = {};
  let section = "";
  const diagnostics: Diagnostic[] = [];

  content.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const sectionMatch = /^\[([^\]]+)\]$/.exec(trimmed);
    if (sectionMatch) {
      section = sectionMatch[1] ?? "";
      return;
    }
    const pair = /^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/.exec(trimmed);
    if (!pair) {
      diagnostics.push({ severity: "warning", message: `Unsupported TOML line ${index + 1} was left uninterpreted.`, path, code: "toml-unsupported-line" });
      return;
    }
    const key = section ? `${section}.${pair[1]}` : pair[1] ?? "";
    values[key] = parseTomlValue(pair[2] ?? "");
  });

  return { values, diagnostics };
}

function parseTomlValue(raw: string): unknown {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^".*"$/.test(value)) return value.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (/^\[.*\]$/.test(value)) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => parseTomlValue(item.trim()))
      .filter((item) => item !== "");
  }
  return value;
}
