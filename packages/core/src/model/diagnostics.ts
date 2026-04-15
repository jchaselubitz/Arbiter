export type DiagnosticSeverity = "info" | "warning" | "error";

export interface Diagnostic {
  severity: DiagnosticSeverity;
  message: string;
  path?: string;
  code?: string;
}
