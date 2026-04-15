import type { ReactNode } from "react";
import type { RouteId } from "../../app/routes";
import { routes } from "../../app/routes";

interface AppShellProps {
  route: RouteId;
  repoPath: string | null;
  onRoute: (route: RouteId) => void;
  onChooseRepo: () => void;
  children: ReactNode;
}

export function AppShell({ route, repoPath, onRoute, onChooseRepo, children }: AppShellProps) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <h1>Agent Permissions Editor</h1>
          <p>This app edits local permission files used by your agents.</p>
        </div>
        <button className="repo-button" type="button" onClick={onChooseRepo}>
          {repoPath ? repoPath : "Choose repository"}
        </button>
        <nav aria-label="Primary">
          {routes.map((item) => (
            <button key={item.id} className={route === item.id ? "active" : ""} type="button" onClick={() => onRoute(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
