import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RouteId } from "../app/routes";
import type { AgentId } from "@arbiter/core";

type Theme = "light" | "dark" | "system";

const PERSIST_KEY = "arbiter-ui";
const LEGACY_PERSIST_KEY = "agentgate-ui";

function migratePersistedUIState() {
  if (typeof window === "undefined") return;

  try {
    const current = window.localStorage.getItem(PERSIST_KEY);
    const legacy = window.localStorage.getItem(LEGACY_PERSIST_KEY);

    if (!current && legacy) {
      window.localStorage.setItem(PERSIST_KEY, legacy);
    }
  } catch {
    // Ignore storage access failures and fall back to the default state.
  }
}

migratePersistedUIState();

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  route: RouteId;
  recentRepos: string[];
  lastRepoPath: string | null;
  lastSelectedAgentIdByRepo: Record<string, AgentId>;
}

interface UIActions {
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRoute: (route: RouteId) => void;
  addRecentRepo: (repoPath: string) => void;
  setLastAgentForRepo: (repoPath: string, agentId: AgentId) => void;
  getLastAgentForRepo: (repoPath: string) => AgentId | null;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      theme: "system",
      sidebarCollapsed: false,
      route: "overview",
      recentRepos: [],
      lastRepoPath: null,
      lastSelectedAgentIdByRepo: {},

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleSidebar: () => {
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      setRoute: (route) => {
        set({ route });
      },

      addRecentRepo: (repoPath) => {
        set((s) => ({
          lastRepoPath: repoPath,
          recentRepos: [
            repoPath,
            ...s.recentRepos.filter((r) => r !== repoPath),
          ].slice(0, 5),
        }));
      },

      setLastAgentForRepo: (repoPath, agentId) => {
        set((s) => ({
          lastSelectedAgentIdByRepo: {
            ...s.lastSelectedAgentIdByRepo,
            [repoPath]: agentId,
          },
        }));
      },

      getLastAgentForRepo: (repoPath) => {
        return get().lastSelectedAgentIdByRepo[repoPath] ?? null;
      },
    }),
    {
      name: PERSIST_KEY,
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        recentRepos: state.recentRepos,
        lastRepoPath: state.lastRepoPath,
        lastSelectedAgentIdByRepo: state.lastSelectedAgentIdByRepo,
      }),
    },
  ),
);

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

export function initTheme() {
  const stored = useUIStore.getState().theme;
  applyTheme(stored);
  if (stored === "system") {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => applyTheme("system"));
  }
}
