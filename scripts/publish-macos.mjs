#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  parseDotEnvContent,
  mergeEnvLayers,
  parsePublishArgs,
  bumpSemver,
  readJsonVersion,
  writeJsonVersion,
  writeTauriConfVersion,
  writeCargoPackageVersion,
  resolveSupabaseUrl,
  resolveSupabaseServiceKey,
  validateCredentials,
  findDmgEntryName,
  buildLatestManifest,
  buildTauriUpdaterLatestJson,
  buildVersionManifestJson,
  resolveTauriUpdaterManifestUrl,
  planVersionRetention,
  hasSigningConfigurationHint,
  bundleMacosDirs
} from './publish-macos/helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BUCKET = 'app-downloads';
const PREFIX = 'arbiter';
const RETAIN_VERSIONS = 3;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function hasCommand({ name }) {
  const lookup = process.platform === 'win32' ? 'where' : 'command';
  const lookupArgs = process.platform === 'win32' ? [name] : ['-v', name];
  return (
    spawnSync(lookup, lookupArgs, {
      shell: process.platform !== 'win32',
      stdio: 'ignore'
    }).status === 0
  );
}

function run({ cmd, args, options = {} }) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: false,
    cwd: REPO_ROOT,
    ...options
  });
  if (res.error) {
    throw res.error;
  }
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

function runCapture({ cmd, args }) {
  const res = spawnSync(cmd, args, {
    encoding: 'utf8',
    cwd: REPO_ROOT
  });
  if (res.error) {
    throw res.error;
  }
  return { status: res.status ?? 1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

function loadMergedEnv() {
  const envPath = path.join(REPO_ROOT, '.env');
  let dot = {};
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    dot = parseDotEnvContent({ content: raw });
  }
  return mergeEnvLayers({ dotenvValues: dot, processEnv: process.env });
}

function readRootPackageVersion() {
  const p = path.join(REPO_ROOT, 'package.json');
  const text = fs.readFileSync(p, 'utf8');
  return readJsonVersion({ jsonText: text });
}

function readProductName() {
  const p = path.join(REPO_ROOT, 'apps/desktop/src-tauri/tauri.conf.json');
  const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (typeof obj.productName !== 'string') {
    throw new Error('tauri.conf.json missing productName');
  }
  return obj.productName;
}

function writeVersionFiles({ nextVersion }) {
  const rootPkg = path.join(REPO_ROOT, 'package.json');
  const desktopPkg = path.join(REPO_ROOT, 'apps/desktop/package.json');
  const tauriConf = path.join(REPO_ROOT, 'apps/desktop/src-tauri/tauri.conf.json');
  const cargoToml = path.join(REPO_ROOT, 'apps/desktop/src-tauri/Cargo.toml');

  fs.writeFileSync(rootPkg, writeJsonVersion({ jsonText: fs.readFileSync(rootPkg, 'utf8'), nextVersion }), 'utf8');
  fs.writeFileSync(
    desktopPkg,
    writeJsonVersion({ jsonText: fs.readFileSync(desktopPkg, 'utf8'), nextVersion }),
    'utf8'
  );
  fs.writeFileSync(
    tauriConf,
    writeTauriConfVersion({ jsonText: fs.readFileSync(tauriConf, 'utf8'), nextVersion }),
    'utf8'
  );
  fs.writeFileSync(
    cargoToml,
    writeCargoPackageVersion({ tomlText: fs.readFileSync(cargoToml, 'utf8'), nextVersion }),
    'utf8'
  );
  console.log(`Synced version to ${nextVersion} across package.json, tauri.conf.json, Cargo.toml`);
}

function validateMacPrereqs({ env, skipCredentials }) {
  if (process.platform !== 'darwin') {
    fail('This script must run on macOS.');
  }
  if (!hasCommand({ name: 'xcrun' })) {
    fail('Missing xcrun (install Xcode Command Line Tools).');
  }
  const notary = runCapture({ cmd: 'xcrun', args: ['--find', 'notarytool'] });
  if (notary.status !== 0) {
    fail('Could not resolve notarytool via xcrun. Update Xcode Command Line Tools.');
  }
  const stapler = runCapture({ cmd: 'xcrun', args: ['--find', 'stapler'] });
  if (stapler.status !== 0) {
    fail('xcrun stapler is unavailable. Update Xcode Command Line Tools.');
  }
  if (!hasCommand({ name: 'spctl' })) {
    fail('Missing spctl.');
  }

  if (!skipCredentials) {
    const credErrors = validateCredentials({ env, skipCredentials: false });
    for (const e of credErrors) {
      console.error(e);
    }
    if (credErrors.length) {
      fail('Set the required environment variables (or pass --skip-credentials for tooling-only checks).');
    }

    if (!hasSigningConfigurationHint({ env })) {
      const id = runCapture({
        cmd: 'bash',
        args: ['-lc', 'security find-identity -v -p codesigning | grep "Developer ID Application" | head -n 1']
      });
      if (!id.stdout.trim()) {
        fail(
          'No Developer ID Application identity detected in Keychain, and no signing env vars set (TAURI_SIGNING_IDENTITY / APPLE_SIGNING_IDENTITY / APPLE_CERTIFICATE / CSC_LINK). Configure signing for Tauri macOS builds.'
        );
      }
    }
  }
}

function resolveDmgPath({ releaseVersion, productName }) {
  const dirs = bundleMacosDirs({ repoRoot: REPO_ROOT });
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      continue;
    }
    const names = fs.readdirSync(dir);
    const hit = findDmgEntryName({ fileNames: names, productName, version: releaseVersion });
    if (hit) {
      return path.join(dir, hit);
    }
  }
  return null;
}

function resolveMacosUpdaterPaths({ productName }) {
  const dirs = bundleMacosDirs({ repoRoot: REPO_ROOT });
  const baseName = `${productName}.app.tar.gz`;
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      continue;
    }
    const tarGz = path.join(dir, baseName);
    if (!fs.existsSync(tarGz)) {
      continue;
    }
    const sig = `${tarGz}.sig`;
    if (!fs.existsSync(sig)) {
      console.warn(
        `Found ${tarGz} but no ${sig}. ` +
          'Set TAURI_SIGNING_PRIVATE_KEY (or TAURI_SIGNING_PRIVATE_KEY_PATH) before `tauri build` to generate updater signatures.'
      );
      continue;
    }
    return { tarGz, sig };
  }
  return null;
}

function sha256File({ filePath }) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(filePath));
  return h.digest('hex');
}

async function listStoragePathsRecursive({ supabase, prefix }) {
  const out = [];
  const stack = [prefix];
  while (stack.length) {
    const p = stack.pop();
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage.from(BUCKET).list(p, {
        limit: 200,
        offset
      });
      if (error) {
        throw error;
      }
      if (!data?.length) {
        break;
      }
      for (const entry of data) {
        const full = `${p}/${entry.name}`.replace(/\/+/g, '/');
        if (entry.id === null && entry.metadata === null) {
          stack.push(full);
        } else {
          out.push(full);
        }
      }
      if (data.length < 200) {
        break;
      }
      offset += data.length;
    }
  }
  return out;
}

async function listTopLevelArbiterChildren({ supabase }) {
  const names = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list(PREFIX, {
      limit: 200,
      offset
    });
    if (error) {
      throw error;
    }
    if (!data?.length) {
      break;
    }
    for (const entry of data) {
      names.push(entry.name);
    }
    if (data.length < 200) {
      break;
    }
    offset += data.length;
  }
  return names;
}

async function removeStoragePrefix({ supabase, prefix }) {
  const paths = await listStoragePathsRecursive({ supabase, prefix });
  if (!paths.length) {
    return;
  }
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    throw error;
  }
}

async function uploadFile({ supabase, objectPath, filePath, contentType }) {
  const body = fs.readFileSync(filePath);
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, body, {
    upsert: true,
    contentType
  });
  if (error) {
    throw error;
  }
}

async function uploadBuffer({ supabase, objectPath, buffer, contentType }) {
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
    upsert: true,
    contentType
  });
  if (error) {
    throw error;
  }
}

async function main() {
  const parsed = parsePublishArgs({ argv: process.argv });
  if (parsed.unknown.length) {
    fail(`Unknown or invalid arguments: ${parsed.unknown.join(', ')}`);
  }

  const env = loadMergedEnv();
  validateMacPrereqs({ env, skipCredentials: parsed.skipCredentials });

  const baseVersion = readRootPackageVersion();
  const releaseVersion =
    parsed.bump === 'none' ? baseVersion : bumpSemver({ version: baseVersion, kind: parsed.bump });

  if (parsed.dryRun) {
    console.log('[dry-run] Skipping version file writes, Tauri build, notarization, and uploads.');
    console.log(`[dry-run] Resolved release version: ${releaseVersion} (from ${baseVersion}, bump=${parsed.bump})`);
  } else if (parsed.bump !== 'none') {
    writeVersionFiles({ nextVersion: releaseVersion });
  }

  const productName = readProductName();

  if (!parsed.dryRun) {
    if (!hasCommand({ name: 'cargo' })) {
      fail('Rust/Cargo is required. Install Rust from https://rustup.rs/');
    }
    run({
      cmd: 'npm',
      args: ['run', 'tauri', '--', 'build', '--target', 'aarch64-apple-darwin'],
      options: { stdio: 'inherit', cwd: REPO_ROOT, env }
    });
  }

  const dmgPath = resolveDmgPath({ releaseVersion, productName });
  if (!dmgPath) {
    fail(
      `Could not find DMG for ${productName} ${releaseVersion} (aarch64). Looked under:\n${bundleMacosDirs({ repoRoot: REPO_ROOT }).join('\n')}`
    );
  }
  console.log(`Using DMG: ${dmgPath}`);

  const artifactName = path.basename(dmgPath);
  const storageKeyDmg = `${PREFIX}/${releaseVersion}/${artifactName}`;
  const storageKeySha = `${PREFIX}/${releaseVersion}/${artifactName}.sha256`;
  const storageKeyManifest = `${PREFIX}/${releaseVersion}/manifest.json`;

  const supabaseUrl = resolveSupabaseUrl({ env });
  const serviceKey = resolveSupabaseServiceKey({ env });

  function buildArtifacts({ sha256, sizeBytes, publicDmgUrl }) {
    const publishedAtIso = new Date().toISOString();
    return {
      publishedAtIso,
      latestPayload: buildLatestManifest({
        version: releaseVersion,
        artifactName,
        arch: 'aarch64',
        platform: 'darwin',
        storagePath: storageKeyDmg,
        publicUrl: publicDmgUrl,
        sha256,
        sizeBytes,
        publishedAtIso
      }),
      manifestJson: buildVersionManifestJson({
        version: releaseVersion,
        artifactName,
        arch: 'aarch64',
        platform: 'darwin',
        storagePaths: { dmg: storageKeyDmg },
        publicUrls: { dmg: publicDmgUrl },
        sha256,
        sizeBytes,
        publishedAtIso
      })
    };
  }

  const publicDmgUrlPreview = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${storageKeyDmg}`;
  let sha256 = sha256File({ filePath: dmgPath });
  let sizeBytes = fs.statSync(dmgPath).size;
  let { publishedAtIso, latestPayload, manifestJson } = buildArtifacts({
    sha256,
    sizeBytes,
    publicDmgUrl: publicDmgUrlPreview
  });

  console.log('[manifest preview]', JSON.stringify(latestPayload, null, 2));

  if (parsed.dryRun) {
    if (!parsed.skipCredentials) {
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      const children = await listTopLevelArbiterChildren({ supabase });
      if (children.length) {
        const plan = planVersionRetention({ folderNames: children, keepCount: RETAIN_VERSIONS });
        console.log('[dry-run] Retention would keep:', plan.keep.join(', '));
        console.log('[dry-run] Retention would remove:', plan.remove.join(', ') || '(none)');
      } else {
        console.log('[dry-run] No existing objects under arbiter/ (or listing empty).');
      }
    } else {
      console.log('[dry-run] Skipping Supabase retention preview (--skip-credentials).');
    }
    console.log('[dry-run] Done.');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  console.log('Submitting to Apple notary service...');
  run({
    cmd: 'xcrun',
    args: [
      'notarytool',
      'submit',
      dmgPath,
      '--apple-id',
      env.APPLE_ID,
      '--team-id',
      env.APPLE_TEAM_ID,
      '--password',
      env.APPLE_APP_SPECIFIC_PASSWORD,
      '--wait'
    ]
  });

  console.log('Stapling...');
  run({ cmd: 'xcrun', args: ['stapler', 'staple', dmgPath] });
  run({ cmd: 'xcrun', args: ['stapler', 'validate', dmgPath] });
  run({ cmd: 'spctl', args: ['--assess', '--type', 'open', '--verbose', dmgPath] });

  sha256 = sha256File({ filePath: dmgPath });
  sizeBytes = fs.statSync(dmgPath).size;
  const {
    data: { publicUrl: publicDmgUrlFinal }
  } = supabase.storage.from(BUCKET).getPublicUrl(storageKeyDmg);
  ({ publishedAtIso, latestPayload, manifestJson } = buildArtifacts({
    sha256,
    sizeBytes,
    publicDmgUrl: publicDmgUrlFinal
  }));

  const checksumBody = `${sha256}  ${artifactName}\n`;
  await uploadFile({ supabase, objectPath: storageKeyDmg, filePath: dmgPath, contentType: 'application/x-apple-diskimage' });
  await uploadBuffer({
    supabase,
    objectPath: storageKeySha,
    buffer: Buffer.from(checksumBody, 'utf8'),
    contentType: 'text/plain'
  });
  await uploadBuffer({
    supabase,
    objectPath: storageKeyManifest,
    buffer: Buffer.from(`${JSON.stringify(manifestJson, null, 2)}\n`, 'utf8'),
    contentType: 'application/json'
  });

  const latestKey = `${PREFIX}/latest.json`;
  await uploadBuffer({
    supabase,
    objectPath: latestKey,
    buffer: Buffer.from(`${JSON.stringify(latestPayload, null, 2)}\n`, 'utf8'),
    contentType: 'application/json'
  });

  const updaterPaths = resolveMacosUpdaterPaths({ productName });
  if (updaterPaths) {
    const tarName = path.basename(updaterPaths.tarGz);
    const storageKeyTar = `${PREFIX}/${releaseVersion}/${tarName}`;
    await uploadFile({
      supabase,
      objectPath: storageKeyTar,
      filePath: updaterPaths.tarGz,
      contentType: 'application/gzip'
    });
    const {
      data: { publicUrl: publicTarUrl }
    } = supabase.storage.from(BUCKET).getPublicUrl(storageKeyTar);
    const sigContent = fs.readFileSync(updaterPaths.sig, 'utf8').trim();
    const tauriLatestPayload = buildTauriUpdaterLatestJson({
      version: releaseVersion,
      notes: '',
      pubDateIso: publishedAtIso,
      darwinAarch64Url: publicTarUrl,
      darwinAarch64Signature: sigContent
    });
    const tauriLatestKey = `${PREFIX}/tauri-latest.json`;
    await uploadBuffer({
      supabase,
      objectPath: tauriLatestKey,
      buffer: Buffer.from(`${JSON.stringify(tauriLatestPayload, null, 2)}\n`, 'utf8'),
      contentType: 'application/json'
    });
    console.log(
      `Tauri updater manifest: ${resolveTauriUpdaterManifestUrl({
        supabaseUrl: supabaseUrl.replace(/\/$/, ''),
        bucket: BUCKET,
        prefix: PREFIX
      })}`
    );
  } else {
    console.warn('Skipping Tauri updater upload (no signed .app.tar.gz bundle found).');
  }

  const top = await listTopLevelArbiterChildren({ supabase });
  const plan = planVersionRetention({ folderNames: top, keepCount: RETAIN_VERSIONS });
  for (const v of plan.remove) {
    const prefix = `${PREFIX}/${v}`;
    console.log(`Pruning old release folder: ${prefix}/`);
    await removeStoragePrefix({ supabase, prefix });
  }

  console.log('Publish complete.');
  console.log(`Public DMG URL: ${latestPayload.publicUrl}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
