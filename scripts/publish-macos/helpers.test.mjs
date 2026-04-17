import test from 'node:test';
import assert from 'node:assert/strict';
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
  resolveTauriUpdaterManifestUrl,
  buildVersionManifestJson,
  isValidSemverFolderName,
  semverCompare,
  planVersionRetention,
  hasSigningConfigurationHint,
  bundleMacosDirs
} from './helpers.mjs';

test('parseDotEnvContent parses keys and quoted values', () => {
  const raw = ['# c', 'FOO=bar', '  EMPTY=', "Z='q'"].join('\n');
  assert.deepEqual(parseDotEnvContent({ content: raw }), { FOO: 'bar', EMPTY: '', Z: 'q' });
});

test('mergeEnvLayers lets process env win', () => {
  assert.deepEqual(
    mergeEnvLayers({
      dotenvValues: { A: '1', B: '2' },
      processEnv: { B: '3', C: '4' }
    }),
    { A: '1', B: '3', C: '4' }
  );
});

test('mergeEnvLayers is case sensitive like process.env', () => {
  assert.deepEqual(
    mergeEnvLayers({
      dotenvValues: { FOO: 'fromfile' },
      processEnv: { FOO: 'fromproc' }
    }),
    { FOO: 'fromproc' }
  );
});

test('parsePublishArgs defaults', () => {
  assert.deepEqual(parsePublishArgs({ argv: ['node', 'x'] }), {
    dryRun: false,
    skipCredentials: false,
    bump: 'patch',
    unknown: []
  });
});

test('parsePublishArgs flags', () => {
  const r = parsePublishArgs({
    argv: ['node', 'x', '--dry-run', '--skip-credentials', '--no-bump']
  });
  assert.equal(r.dryRun, true);
  assert.equal(r.skipCredentials, true);
  assert.equal(r.bump, 'none');
});

test('parsePublishArgs rejects conflicting bump flags', () => {
  const r = parsePublishArgs({ argv: ['node', 'x', '--minor', '--major'] });
  assert.ok(r.unknown.some(u => u.includes('conflicting')));
});

test('bumpSemver', () => {
  assert.equal(bumpSemver({ version: '1.2.3', kind: 'patch' }), '1.2.4');
  assert.equal(bumpSemver({ version: '1.2.3', kind: 'minor' }), '1.3.0');
  assert.equal(bumpSemver({ version: '1.2.3', kind: 'major' }), '2.0.0');
  assert.equal(bumpSemver({ version: '1.2.3', kind: 'none' }), '1.2.3');
});

test('readJsonVersion / writeJsonVersion preserves trailing newline', () => {
  const src = `{\n  "name": "x",\n  "version": "0.3.0"\n}\n`;
  assert.equal(readJsonVersion({ jsonText: src }), '0.3.0');
  const next = writeJsonVersion({ jsonText: src, nextVersion: '0.3.1' });
  assert.equal(readJsonVersion({ jsonText: next }), '0.3.1');
  assert.ok(next.endsWith('\n'));
});

test('writeTauriConfVersion', () => {
  const src = `{\n  "version": "0.1.0",\n  "x": 1\n}\n`;
  const next = writeTauriConfVersion({ jsonText: src, nextVersion: '0.3.0' });
  assert.equal(JSON.parse(next).version, '0.3.0');
});

test('writeCargoPackageVersion', () => {
  const src = '[package]\nname = "app"\nversion = "0.1.0"\n';
  const next = writeCargoPackageVersion({ tomlText: src, nextVersion: '0.3.0' });
  assert.match(next, /version = "0.3.0"/);
});

test('resolve supabase env aliases', () => {
  assert.equal(resolveSupabaseUrl({ env: { NEXT_PUBLIC_SUPABASE_URL: 'https://a' } }), 'https://a');
  assert.equal(resolveSupabaseUrl({ env: { SUPABASE_URL: 'https://b' } }), 'https://b');
  assert.equal(resolveSupabaseServiceKey({ env: { SUPABASE_SECRET_KEY: 'k' } }), 'k');
  assert.equal(resolveSupabaseServiceKey({ env: { SUPABASE_SERVICE_ROLE_KEY: 'r' } }), 'r');
});

test('validateCredentials respects skipCredentials', () => {
  assert.equal(validateCredentials({ env: {}, skipCredentials: true }).length, 0);
  const err = validateCredentials({ env: {}, skipCredentials: false });
  assert.ok(err.length >= 4);
});

test('findDmgEntryName exact and fuzzy', () => {
  const names = ['Arbiter_0.3.0_aarch64.dmg', 'other.dmg'];
  assert.equal(
    findDmgEntryName({ fileNames: names, productName: 'Arbiter', version: '0.3.0' }),
    'Arbiter_0.3.0_aarch64.dmg'
  );
  assert.equal(
    findDmgEntryName({
      fileNames: ['Arbiter_0.3.0_aarch64-universal.dmg'],
      productName: 'Arbiter',
      version: '0.3.0'
    }),
    null
  );
});

test('buildTauriUpdaterLatestJson shape', () => {
  const j = buildTauriUpdaterLatestJson({
    version: '0.4.0',
    notes: 'Fixes',
    pubDateIso: '2026-01-02T00:00:00.000Z',
    darwinAarch64Url: 'https://x/t.tar.gz',
    darwinAarch64Signature: 'sigline\n'
  });
  assert.equal(j.version, '0.4.0');
  assert.equal(j.platforms['darwin-aarch64'].signature, 'sigline');
  assert.equal(j.platforms['darwin-aarch64'].url, 'https://x/t.tar.gz');
});

test('resolveTauriUpdaterManifestUrl', () => {
  assert.equal(
    resolveTauriUpdaterManifestUrl({
      supabaseUrl: 'https://abc.supabase.co/',
      bucket: 'app-downloads',
      prefix: 'arbiter'
    }),
    'https://abc.supabase.co/storage/v1/object/public/app-downloads/arbiter/tauri-latest.json'
  );
});

test('buildLatestManifest shape', () => {
  const m = buildLatestManifest({
    version: '0.3.1',
    artifactName: 'Arbiter_0.3.1_aarch64.dmg',
    arch: 'aarch64',
    platform: 'darwin',
    storagePath: 'arbiter/0.3.1/Arbiter_0.3.1_aarch64.dmg',
    publicUrl: 'https://x/storage/v1/object/public/app-downloads/arbiter/0.3.1/x.dmg',
    sha256: 'abc',
    sizeBytes: 123,
    publishedAtIso: '2026-01-01T00:00:00.000Z'
  });
  assert.equal(m.version, '0.3.1');
  assert.equal(m.size, 123);
});

test('buildVersionManifestJson', () => {
  const j = buildVersionManifestJson({
    version: '0.3.1',
    artifactName: 'x.dmg',
    arch: 'aarch64',
    platform: 'darwin',
    storagePaths: { dmg: 'arbiter/0.3.1/x.dmg' },
    publicUrls: { dmg: 'https://p' },
    sha256: 's',
    sizeBytes: 9,
    publishedAtIso: 't'
  });
  assert.equal(j.artifacts[0].publicUrl, 'https://p');
});

test('isValidSemverFolderName', () => {
  assert.equal(isValidSemverFolderName({ name: '0.3.0' }), true);
  assert.equal(isValidSemverFolderName({ name: 'latest.json' }), false);
  assert.equal(isValidSemverFolderName({ name: 'tauri-latest.json' }), false);
  assert.equal(isValidSemverFolderName({ name: 'v1' }), false);
});

test('semverCompare and planVersionRetention', () => {
  assert.ok(semverCompare({ a: '0.10.0', b: '0.9.0' }) > 0);
  assert.ok(semverCompare({ a: '0.2.0', b: '0.2.1' }) < 0);
  const plan = planVersionRetention({
    folderNames: ['0.1.0', '0.2.0', '0.3.0', '0.4.0', 'latest.json', 'nope'],
    keepCount: 3
  });
  assert.deepEqual(plan.keep, ['0.4.0', '0.3.0', '0.2.0']);
  assert.deepEqual(plan.remove.sort(), ['0.1.0']);
});

test('hasSigningConfigurationHint', () => {
  assert.equal(hasSigningConfigurationHint({ env: {} }), false);
  assert.equal(hasSigningConfigurationHint({ env: { TAURI_SIGNING_IDENTITY: '  x ' } }), true);
});

test('bundleMacosDirs returns aarch64-first paths', () => {
  const dirs = bundleMacosDirs({ repoRoot: '/r' });
  assert.ok(dirs[0].includes('aarch64-apple-darwin'));
});
