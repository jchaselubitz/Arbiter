#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeEnvLayers, parseDotEnvContent } from './publish-macos/helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function loadMergedProcessEnv() {
  const envPath = path.join(REPO_ROOT, '.env');
  let dot = {};
  if (fs.existsSync(envPath)) {
    dot = parseDotEnvContent({ content: fs.readFileSync(envPath, 'utf8') });
  }
  return mergeEnvLayers({ dotenvValues: dot, processEnv: process.env });
}

const args = process.argv.slice(2);
const command = args[0] ?? "";
const needsRust = new Set(["build", "dev", "android", "ios"]);

function envForTauriSpawn() {
  let env = loadMergedProcessEnv();
  // Tauri create-dmg runs AppleScript against Finder unless CI=true (adds --skip-jenkins).
  // Local builds often fail with "error running bundle_dmg.sh" without Finder automation.
  if (
    command === 'build' &&
    process.platform === 'darwin' &&
    env.TAURI_DMG_USE_FINDER !== 'true'
  ) {
    env = { ...env, CI: 'true' };
  }
  return env;
}

function hasCommand(name) {
  const lookup = process.platform === "win32" ? "where" : "command";
  const lookupArgs = process.platform === "win32" ? [name] : ["-v", name];
  return (
    spawnSync(lookup, lookupArgs, {
      shell: process.platform !== "win32",
      stdio: "ignore",
    }).status === 0
  );
}

if (needsRust.has(command) && !hasCommand("cargo")) {
  console.error(
    [
      "Rust/Cargo is required before running Tauri desktop commands.",
      "",
      "Install Rust from https://rustup.rs/, then restart your shell so `cargo` is on PATH.",
      "After that, rerun:",
      `  npm run tauri -- ${args.join(" ")}`,
      "",
      "The previous Tauri error `failed to run cargo metadata ... No such file or directory` means the `cargo` binary was not found.",
    ].join("\n"),
  );
  process.exit(1);
}

const result = spawnSync(
  'npm',
  ['run', 'tauri', '-w', '@arbiter/desktop', '--', ...args],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: envForTauriSpawn()
  }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
