import type { DiscoveryContext } from "../adapters/types";

export function createDiscoveryContext(input: {
  homeDir: string;
  repoPath?: string | null;
  platform?: DiscoveryContext["platform"];
}): DiscoveryContext {
  return {
    homeDir: input.homeDir.replace(/\/$/, ""),
    repoPath: input.repoPath ? input.repoPath.replace(/\/$/, "") : null,
    platform: input.platform ?? "unknown"
  };
}
