import { getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, type DownloadEvent, type Update } from '@tauri-apps/plugin-updater';

export type { DownloadEvent, Update };

export type CheckForUpdateResult =
  | { kind: 'no-update' }
  | { kind: 'update-available'; update: Update };

export async function getAppVersion(): Promise<string> {
  return getVersion();
}

export async function checkForUpdate(): Promise<CheckForUpdateResult> {
  const update = await check();
  if (!update) {
    return { kind: 'no-update' };
  }
  return { kind: 'update-available', update };
}

export async function downloadUpdate({
  update,
  onEvent
}: {
  update: Update;
  onEvent?: (event: DownloadEvent) => void;
}): Promise<void> {
  await update.download(onEvent);
}

export async function installDownloadedUpdateAndRelaunch({
  update
}: {
  update: Update;
}): Promise<void> {
  await update.install();
  await relaunch();
}
