import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { BackupRecord, SourceFile } from "@arbiter/core";

export interface RuntimeContextDto {
  homeDir: string;
  platform: "macos" | "linux" | "windows" | "unknown";
  appDataDir: string;
}

export interface FileStateDto {
  path: string;
  exists: boolean;
  content: string | null;
  writableByApp: boolean;
  isSymlink: boolean;
  resolvedPath: string | null;
  diagnostics: string[];
}

export interface WritePermissionRequest {
  path: string;
  beforeHash: string;
  before: string;
  after: string;
  repoPath: string | null;
  backup: {
    adapterId: string;
    adapterVersion: string;
    originalPath: string;
    before: string;
    after: string;
    actionLabel: string;
    diffSummary: string;
  };
}

export interface WritePermissionResponse {
  backup: BackupRecord;
  reread: FileStateDto;
}

export async function getRuntimeContext(): Promise<RuntimeContextDto> {
  return invoke("get_runtime_context");
}

export async function chooseRepository(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Choose repository folder",
  });
  return typeof selected === "string" ? selected : null;
}

export async function readCandidateFiles(
  paths: string[],
): Promise<FileStateDto[]> {
  return invoke("read_candidate_files", { request: { paths } });
}

export async function writePermissionFile(
  request: WritePermissionRequest,
): Promise<WritePermissionResponse> {
  return invoke("write_permission_file", { request });
}

export async function listBackups(): Promise<BackupRecord[]> {
  return invoke("list_backups");
}

export async function openInFinder(path: string): Promise<void> {
  return invoke("open_in_finder", { path });
}

export function hydrateSources(
  sources: SourceFile[],
  states: FileStateDto[],
): SourceFile[] {
  const byPath = new Map(states.map((state) => [state.path, state]));
  return sources.map((source) => {
    const state = byPath.get(source.path);
    if (!state) return source;
    return {
      ...source,
      exists: state.exists,
      content: state.content,
      writableByApp: state.writableByApp || !state.exists,
      isSymlink: state.isSymlink,
      resolvedPath: state.resolvedPath,
      writeSupport: state.isSymlink ? "read-only" : source.writeSupport,
    };
  });
}

export async function sha256Text(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
