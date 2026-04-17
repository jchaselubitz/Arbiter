import * as React from "react";
import { useState } from "react";
import type { BackupRecord } from "@arbiter/core";
import { Archive, Clock } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import { OpenInFinderButton } from "../../components/file/OpenInFinderButton";

interface BackupsProps {
  backups: BackupRecord[];
  onNavigateHome: () => void;
  onRestore?: (backup: BackupRecord) => void;
}

function Backups({ backups, onNavigateHome, onRestore }: BackupsProps) {
  const [selected, setSelected] = useState<BackupRecord | null>(null);

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Overview", onClick: onNavigateHome },
          { label: "Backups" }
        ]}
      />
      <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Backups</h1>

      {backups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-4">
            <Archive className="h-8 w-8 text-zinc-400" aria-hidden />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No backups yet. Backups are created when you write permission changes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-[#1d7f68]/50 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <button
                type="button"
                onClick={() => setSelected(backup)}
                className="flex flex-1 items-start gap-3 min-w-0 text-left"
              >
                <div className="rounded-md bg-zinc-100 p-2 dark:bg-zinc-800 shrink-0">
                  <Archive className="h-4 w-4 text-zinc-500" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      {backup.originalPath}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{backup.actionLabel}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5 line-clamp-1">{backup.diffSummary}</p>
                </div>
              </button>
              <OpenInFinderButton path={backup.backupPath} className="shrink-0" />
              <div className="flex items-center gap-1 text-xs text-zinc-400 shrink-0 mt-0.5">
                <Clock className="h-3 w-3" aria-hidden />
                {backup.createdAt}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Backup detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open: boolean) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Backup — {selected.originalPath.split("/").at(-1)}</DialogTitle>
              <DialogDescription>
                {selected.actionLabel} · {selected.createdAt}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Summary</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{selected.diffSummary}</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <p className="text-xs font-mono text-zinc-400 break-all">{selected.backupPath}</p>
                  <OpenInFinderButton path={selected.backupPath} className="shrink-0" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              {onRestore && (
                <Button
                  variant="destructive"
                  onClick={() => { onRestore(selected); setSelected(null); }}
                >
                  Restore this version
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

export { Backups };
