export type RouteId = "overview" | "agents" | "files" | "change-review" | "backups" | "docs" | "settings";

export const routes: Array<{ id: RouteId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "agents", label: "Permissions" },
  { id: "files", label: "Files" },
  { id: "change-review", label: "Changes & Backups" },
  { id: "backups", label: "Backups" },
  { id: "docs", label: "Documentation" },
  { id: "settings", label: "Settings" }
];
