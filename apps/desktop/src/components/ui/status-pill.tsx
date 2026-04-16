import * as React from "react";
import { Badge } from "./badge";
import { cn } from "../../lib/cn";

type Tone = "ok" | "warn" | "danger" | "muted";

interface StatusPillProps extends React.HTMLAttributes<HTMLDivElement> {
  tone: Tone;
}

const toneToVariant: Record<Tone, "ok" | "warn" | "danger" | "muted"> = {
  ok: "ok",
  warn: "warn",
  danger: "danger",
  muted: "muted"
};

function StatusPill({ tone, className, children, ...props }: StatusPillProps) {
  return (
    <Badge
      variant={toneToVariant[tone]}
      className={cn("font-semibold capitalize", className)}
      {...props}
    >
      {children}
    </Badge>
  );
}

export { StatusPill };
export type { Tone };
