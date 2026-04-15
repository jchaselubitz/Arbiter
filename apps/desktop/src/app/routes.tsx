export type RouteId = "overview" | "agents" | "files" | "change-review" | "backups" | "docs" | "settings";

export const routes: Array<{ id: RouteId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "agents", label: "Agents" },
  { id: "files", label: "Files" },
  { id: "change-review", label: "Change Review" },
  { id: "backups", label: "Backups" },
  { id: "docs", label: "Documentation Status" },
  { id: "settings", label: "Settings" }
];
