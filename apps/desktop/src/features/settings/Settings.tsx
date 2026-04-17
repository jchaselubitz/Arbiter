import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Kbd } from "../../components/ui/kbd";
import { Button } from "../../components/ui/button";
import { useUIStore } from "../../stores/useUIStore";
import { cn } from "../../lib/cn";
import type { Update } from "../../lib/updaterClient";
import {
  checkForUpdate,
  downloadUpdate,
  getAppVersion,
  installDownloadedUpdateAndRelaunch
} from "../../lib/updaterClient";

type Theme = "light" | "dark" | "system";

const themeOptions: Array<{ value: Theme; label: string; icon: React.ElementType }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor }
];

const shortcuts = [
  { keys: ["⌘", "1–6"], label: "Switch to agent 1–6" },
  { keys: ["⌘", "\\"], label: "Toggle sidebar" },
  { keys: ["⌘", "↵"], label: "Confirm write (change review)" },
  { keys: ["Esc"], label: "Close dialog / sheet" }
];

function Settings() {
  const { theme, setTheme } = useUIStore();
  const [appVersion, setAppVersion] = React.useState<string>("…");
  const [availableUpdate, setAvailableUpdate] = React.useState<Update | null>(null);
  const [downloadReady, setDownloadReady] = React.useState(false);
  const [busyAction, setBusyAction] = React.useState<"check" | "download" | "install" | null>(null);

  React.useEffect(() => {
    void getAppVersion()
      .then((v) => setAppVersion(v))
      .catch(() => setAppVersion("unknown"));
  }, []);

  React.useEffect(() => {
    return () => {
      if (availableUpdate) {
        void availableUpdate.close();
      }
    };
  }, [availableUpdate]);

  async function handleCheckForUpdates() {
    setBusyAction("check");
    try {
      if (availableUpdate) {
        await availableUpdate.close();
        setAvailableUpdate(null);
      }
      setDownloadReady(false);
      const result = await checkForUpdate();
      if (result.kind === "no-update") {
        toast.success("You are on the latest version.");
        return;
      }
      setAvailableUpdate(result.update);
      toast.message(`Update available: ${result.update.version}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update check failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownloadUpdate() {
    if (!availableUpdate) {
      return;
    }
    setBusyAction("download");
    try {
      await downloadUpdate({ update: availableUpdate });
      setDownloadReady(true);
      toast.success("Update downloaded. Click Install to restart and apply.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleInstallUpdate() {
    if (!availableUpdate) {
      return;
    }
    setBusyAction("install");
    try {
      await installDownloadedUpdateAndRelaunch({ update: availableUpdate });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Install failed");
      setBusyAction(null);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Settings</h1>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Choose your preferred color scheme. "System" follows your OS setting.
          </p>
          <div className="flex gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors",
                    isActive
                      ? "border-[#1d7f68] bg-[#eef8f5] text-[#1d7f68] dark:border-[#3dd6aa] dark:bg-[#162f2a] dark:text-[#3dd6aa]"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                  aria-pressed={isActive}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Keyboard shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{s.label}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k, j) => (
                    <Kbd key={j}>{k}</Kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Arbiter is a local-first desktop editor for AI agent permission files. No background
            service is required — changes are written directly to native config files.
          </p>
          <Separator className="my-4" />
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Version</span>
              <span className="text-sm tabular-nums text-zinc-600 dark:text-zinc-300">{appVersion}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busyAction !== null}
                onClick={() => void handleCheckForUpdates()}
              >
                {busyAction === "check" ? "Checking…" : "Check for updates"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!availableUpdate || busyAction !== null}
                onClick={() => void handleDownloadUpdate()}
              >
                {busyAction === "download" ? "Downloading…" : "Download update"}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!availableUpdate || !downloadReady || busyAction !== null}
                onClick={() => void handleInstallUpdate()}
              >
                {busyAction === "install" ? "Installing…" : "Install update"}
              </Button>
            </div>
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Manual documentation checks and external editor integration are intentionally not
            enabled in this release.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export { Settings };
