/**
 * Pure helpers for macOS publish / notarize / Supabase release automation.
 * Covered by `node --test scripts/publish-macos/helpers.test.mjs`.
 */

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/;

export function parseDotEnvContent({ content }) {
  const out = {};
  if (!content) {
    return out;
  }
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function mergeEnvLayers({ dotenvValues, processEnv }) {
  return { ...dotenvValues, ...processEnv };
}

export function parsePublishArgs({ argv }) {
  const args = argv.slice(2);
  let dryRun = false;
  let skipCredentials = false;
  let bump = 'patch';
  const unknown = [];

  for (const a of args) {
    if (a === '--dry-run') {
      dryRun = true;
    } else if (a === '--skip-credentials') {
      skipCredentials = true;
    } else if (a === '--no-bump') {
      bump = 'none';
    } else if (a === '--minor') {
      bump = 'minor';
    } else if (a === '--major') {
      bump = 'major';
    } else if (a === '--patch') {
      bump = 'patch';
    } else if (a.startsWith('-')) {
      unknown.push(a);
    }
  }

  const bumpKinds = new Set();
  if (args.includes('--no-bump')) {
    bumpKinds.add('none');
  }
  if (args.includes('--minor')) {
    bumpKinds.add('minor');
  }
  if (args.includes('--major')) {
    bumpKinds.add('major');
  }
  if (args.includes('--patch')) {
    bumpKinds.add('patch');
  }
  if (bumpKinds.size > 1) {
    unknown.push('(conflicting version bump flags)');
  }

  return { dryRun, skipCredentials, bump, unknown };
}

export function hasSigningConfigurationHint({ env }) {
  const keys = [
    'TAURI_SIGNING_IDENTITY',
    'APPLE_SIGNING_IDENTITY',
    'CODESIGN_IDENTITY',
    'APPLE_CERTIFICATE',
    'CSC_LINK'
  ];
  return keys.some(k => {
    const v = env[k];
    return typeof v === 'string' && v.trim().length > 0;
  });
}

export function bumpSemver({ version, kind }) {
  const m = version.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) {
    throw new Error(`Invalid semver base: ${version}`);
  }
  let major = Number(m[1]);
  let minor = Number(m[2]);
  let patch = Number(m[3]);

  if (kind === 'none') {
    return `${major}.${minor}.${patch}`;
  }
  if (kind === 'patch') {
    patch += 1;
  } else if (kind === 'minor') {
    minor += 1;
    patch = 0;
  } else if (kind === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else {
    throw new Error(`Unknown bump kind: ${kind}`);
  }
  return `${major}.${minor}.${patch}`;
}

export function readJsonVersion({ jsonText }) {
  const obj = JSON.parse(jsonText);
  if (typeof obj.version !== 'string') {
    throw new Error('package json missing string "version"');
  }
  return obj.version;
}

export function writeJsonVersion({ jsonText, nextVersion }) {
  const obj = JSON.parse(jsonText);
  obj.version = nextVersion;
  const indent = detectJsonIndent({ jsonText });
  const nl = jsonText.endsWith('\n') ? '\n' : '';
  return `${JSON.stringify(obj, null, indent)}${nl}`;
}

export function detectJsonIndent({ jsonText }) {
  const m = jsonText.match(/\{\r?\n(\s+)/);
  if (m) {
    return m[1].length;
  }
  return 2;
}

export function writeTauriConfVersion({ jsonText, nextVersion }) {
  const obj = JSON.parse(jsonText);
  if (typeof obj.version !== 'string') {
    throw new Error('tauri.conf.json missing string "version"');
  }
  obj.version = nextVersion;
  const indent = detectJsonIndent({ jsonText });
  const nl = jsonText.endsWith('\n') ? '\n' : '';
  return `${JSON.stringify(obj, null, indent)}${nl}`;
}

export function writeCargoPackageVersion({ tomlText, nextVersion }) {
  const next = tomlText.replace(/^version\s*=\s*"[^"]*"\s*$/m, `version = "${nextVersion}"`);
  if (next === tomlText) {
    throw new Error('Failed to update Cargo.toml package version (pattern not found)');
  }
  return next;
}

export function resolveSupabaseUrl({ env }) {
  return env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '';
}

export function resolveSupabaseServiceKey({ env }) {
  return env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function validateCredentials({ env, skipCredentials }) {
  const errors = [];
  if (skipCredentials) {
    return errors;
  }
  if (!env.APPLE_TEAM_ID) {
    errors.push('Missing APPLE_TEAM_ID');
  }
  if (!env.APPLE_ID) {
    errors.push('Missing APPLE_ID');
  }
  if (!env.APPLE_PASSWORD) {
    errors.push('Missing APPLE_PASSWORD');
  }
  const url = resolveSupabaseUrl({ env });
  if (!url) {
    errors.push('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  }
  const key = resolveSupabaseServiceKey({ env });
  if (!key) {
    errors.push('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY');
  }
  return errors;
}

export function findDmgEntryName({ fileNames, productName, version }) {
  const exact = `${productName}_${version}_aarch64.dmg`;
  if (fileNames.includes(exact)) {
    return exact;
  }
  const suffix = `_${version}_aarch64.dmg`;
  const loose = fileNames.filter(n => n.endsWith(suffix) && n.startsWith(`${productName}_`));
  if (loose.length === 1) {
    return loose[0];
  }
  if (loose.length > 1) {
    throw new Error(`Ambiguous DMG matches for ${version}: ${loose.join(', ')}`);
  }
  const aarch64Only = fileNames.filter(
    n =>
      n.toLowerCase().endsWith('.dmg') &&
      n.includes(version) &&
      n.includes('aarch64') &&
      !n.toLowerCase().includes('universal')
  );
  if (aarch64Only.length === 1) {
    return aarch64Only[0];
  }
  return null;
}

export function buildLatestManifest({
  version,
  artifactName,
  arch,
  platform,
  storagePath,
  publicUrl,
  sha256,
  sizeBytes,
  publishedAtIso
}) {
  return {
    version,
    artifactName,
    arch,
    platform,
    storagePath,
    publicUrl,
    sha256,
    size: sizeBytes,
    publishedAt: publishedAtIso
  };
}

/** Static JSON shape consumed by Tauri v2 updater (macOS Apple Silicon). */
export function buildTauriUpdaterLatestJson({
  version,
  notes,
  pubDateIso,
  darwinAarch64Url,
  darwinAarch64Signature
}) {
  return {
    version,
    notes: notes ?? '',
    pub_date: pubDateIso,
    platforms: {
      'darwin-aarch64': {
        signature: darwinAarch64Signature.trim(),
        url: darwinAarch64Url
      }
    }
  };
}

export function resolveTauriUpdaterManifestUrl({ supabaseUrl, bucket, prefix }) {
  const base = (supabaseUrl || '').replace(/\/$/, '');
  const b = bucket || 'app-downloads';
  const p = prefix || 'arbiter';
  return `${base}/storage/v1/object/public/${b}/${p}/tauri-latest.json`;
}

export function buildVersionManifestJson({
  version,
  artifactName,
  arch,
  platform,
  storagePaths,
  publicUrls,
  sha256,
  sizeBytes,
  publishedAtIso
}) {
  return {
    version,
    publishedAt: publishedAtIso,
    artifacts: [
      {
        name: artifactName,
        arch,
        platform,
        storagePath: storagePaths.dmg,
        publicUrl: publicUrls.dmg,
        sha256,
        size: sizeBytes
      }
    ]
  };
}

export function isValidSemverFolderName({ name }) {
  if (name === 'latest.json' || name === 'tauri-latest.json') {
    return false;
  }
  return SEMVER_RE.test(name);
}

export function semverCompare({ a, b }) {
  const ma = a.match(/^(\d+)\.(\d+)\.(\d+)/);
  const mb = b.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!ma || !mb) {
    return a.localeCompare(b);
  }
  for (let i = 1; i <= 3; i++) {
    const da = Number(ma[i]);
    const db = Number(mb[i]);
    if (da !== db) {
      return da - db;
    }
  }
  return 0;
}

export function planVersionRetention({ folderNames, keepCount }) {
  const versions = folderNames.filter(n => isValidSemverFolderName({ name: n }));
  const sorted = [...versions].sort((x, y) => semverCompare({ a: y, b: x }));
  const keep = sorted.slice(0, keepCount);
  const keepSet = new Set(keep);
  const remove = versions.filter(v => !keepSet.has(v));
  return { keep, remove };
}

export function bundleMacosDirs({ repoRoot }) {
  const rel = [
    'apps/desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/macos',
    'apps/desktop/src-tauri/target/release/bundle/macos'
  ];
  return rel.map(r => `${repoRoot}/${r}`);
}
