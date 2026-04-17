#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const command = args[0] ?? "";
const needsRust = new Set(["build", "dev", "android", "ios"]);

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
  "npm",
  ["run", "tauri", "-w", "@arbiter/desktop", "--", ...args],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
