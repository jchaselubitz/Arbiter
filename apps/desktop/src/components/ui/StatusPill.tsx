import type { ReactNode } from "react";

interface StatusPillProps {
  tone: "ok" | "warn" | "danger" | "muted";
  children: ReactNode;
}

export function StatusPill({ tone, children }: StatusPillProps) {
  return <span className={`status-pill status-${tone}`}>{children}</span>;
}
