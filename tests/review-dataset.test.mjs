/**
 * Company: EonHive Inc. | Title: Evaluation dataset workflow regressions
 * Purpose: Verify review declarations, held-out overlap checks and private immutable imports.
 * Author: Stan Nesi | Created: 2026-10-31 | Updated: 2026-10-31
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { importReviewDataset, loadReviewDataset, readDatasetText, sha256 } from '../eval/review-dataset.mjs';

const exampleText = await readFile(new URL('../eval/text-review.example.v1.json', import.meta.url), 'utf8');
const example = JSON.parse(exampleText);
const code = (expected) => (error) => error.code === expected;
const textOf = (value) => JSON.stringify(value);

// These are schema-only declarations, not actual human-reviewed or held-out evidence.
function declaredDataset(split) {
  const data = structuredClone(example);
  data.split = split;
  data.reviewStatus = 'human_reviewed';
  data.cases = [data.cases[0]];
  data.cases[0].review = { status: 'human_reviewed', reviewer: 'schema-test-reviewer',
    reviewedAt: '2026-10-31T12:00:00.000Z', independentOfDevelopment: true };
  if (split === 'held_out') {
    data.provenance.sourceKind = 'independent_collection';
    data.provenance.source = 'Fictional test attestation; no independent collection performed.';
    data.holdout = { frozenAt: '2026-10-31T11:00:00.000Z', notUsedForDevelopment: true };
    data.cases[0].request.content.text = 'A disjoint schema-only sentence.';
  }
  return data;
}

test('versioned provisional format preserves exact bytes for hashes and does not upgrade review', () => {
  const loaded = loadReviewDataset(exampleText);
  assert.equal(loaded.datasetSha256, sha256(exampleText));
  assert.equal(loaded.dataset.reviewStatus, 'provisional');
  assert.equal(loaded.dataset.split, 'development');
  assert.notEqual(loaded.datasetSha256, loadReviewDataset(textOf(example)).datasetSha256);
  assert.deepEqual(loaded.dataset, example);
});

test('legacy diagnostic mapping retains every label, request and original hash', async () => {
  const text = await readFile(new URL('../eval/native-text.v1.json', import.meta.url), 'utf8');
  const original = JSON.parse(text);
  const loaded = loadReviewDataset(text);
  assert.equal(loaded.datasetSha256, '9d8f5dcd196a565b03c618af00cc5f4f5d4f658666183c612248b3f577eb3a34');
  for (let index = 0; index < original.cases.length; index++) {
    const before = original.cases[index];
    const after = loaded.dataset.cases[index];
    assert.equal(after.request.content.text, before.text);
    assert.deepEqual(Object.keys(after.labels).filter((key) => after.labels[key]), before.expectedCategories);
    assert.deepEqual(after.request.context, { languageHint: 'en', ...before.context });
  }
  assert.equal(loaded.dataset.reviewStatus, 'provisional');
  assert.equal(loaded.dataset.provenance.visibility, 'private'); // legacy has no visibility assertion
});

for (const [name, mutate] of [
  ['unknown field', (data) => { data.extra = true; }],
  ['wrong version', (data) => { data.schemaVersion = 'future'; }],
  ['missing dataset version', (data) => { delete data.datasetVersion; }],
  ['missing label definition', (data) => { delete data.labelDefinition; }],
  ['missing rights', (data) => { delete data.provenance.rights; }],
  ['blank provenance', (data) => { data.provenance.source = '   '; }],
  ['missing review', (data) => { delete data.cases[0].review; }],
  ['duplicate IDs', (data) => { data.cases.push(data.cases[0]); }],
  ['different request ID', (data) => { data.cases[0].request.requestId = 'other'; }],
  ['missing category label', (data) => { data.cases[0].labels = {}; }],
  ['extra category label', (data) => { data.cases[0].labels.threat = false; }],
  ['coerced label', (data) => { data.cases[0].labels.harassment = 'false'; }],
  ['duplicate tags', (data) => { data.cases[0].tags = ['same', 'same']; }],
  ['invalid source annotation', (data) => { data.cases[5].evidenceSpans[0].end = 100; }],
  ['negative annotation', (data) => { data.cases[5].labels.threat = false; }],
  ['oversized input', (data) => { data.cases[0].request.content.text = 'a'.repeat(16_001); }],
]) {
  test(`dataset validation rejects ${name}`, () => {
    const data = structuredClone(example);
    mutate(data);
    assert.throws(() => loadReviewDataset(textOf(data)), code('invalid_dataset'));
  });
}

test('human-review declarations require complete independent reviewer metadata', () => {
  const data = declaredDataset('human_reviewed');
  assert.equal(loadReviewDataset(textOf(data)).dataset.reviewStatus, 'human_reviewed');
  for (const review of [{ status: 'human_reviewed' },
    { ...data.cases[0].review, reviewer: 'codex' },
    { ...data.cases[0].review, independentOfDevelopment: false }]) {
    const changed = structuredClone(data);
    changed.cases[0].review = review;
    assert.throws(() => loadReviewDataset(textOf(changed)), code('invalid_dataset'));
  }
  assert.match(loadReviewDataset(textOf(data)).attestations, /does not verify identity/);
});

test('synthetic development material cannot become held-out by changing its split', () => {
  const data = declaredDataset('held_out');
  data.provenance.sourceKind = 'synthetic_development';
  assert.throws(() => loadReviewDataset(textOf(data), [exampleText]), code('invalid_dataset'));
});

test('held-out validation requires reference data, a freeze and disjoint normalized text', () => {
  const data = declaredDataset('held_out');
  assert.throws(() => loadReviewDataset(textOf(data)), code('held_out_requires_development_reference'));
  const loaded = loadReviewDataset(textOf(data), [exampleText]);
  assert.deepEqual(loaded.referenceHashes, [sha256(exampleText)]);
  assert.equal(loaded.dataset.split, 'held_out');
  delete data.holdout;
  assert.throws(() => loadReviewDataset(textOf(data), [exampleText]), code('invalid_dataset'));
  data.holdout = loaded.dataset.holdout;
  data.cases[0].request.content.text = '  THANKS   FOR THE EXPLANATION. ';
  assert.throws(() => loadReviewDataset(textOf(data), [exampleText]), code('held_out_content_overlap'));
});

test('held-out duplicate content is rejected even with different IDs and labels', () => {
  const data = declaredDataset('held_out');
  const duplicate = structuredClone(data.cases[0]);
  duplicate.id = duplicate.request.requestId = 'duplicate';
  duplicate.labels.harassment = true;
  data.cases.push(duplicate);
  assert.throws(() => loadReviewDataset(textOf(data), [exampleText]), code('held_out_content_overlap'));
});

test('imports preserve bytes, protect versions and reject public/source and other Git directories', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'toxiply-dataset-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = join(directory, 'source.json');
  await writeFile(source, exampleText);
  const imported = await importReviewDataset(source, directory);
  assert.equal(await readFile(imported.destination, 'utf8'), exampleText);
  assert.equal(imported.datasetSha256, sha256(exampleText));
  await assert.rejects(importReviewDataset(source, directory), code('dataset_version_exists'));
  await assert.rejects(importReviewDataset(source, fileURLToPath(new URL('../eval', import.meta.url))),
    code('import_requires_ignored_or_external_directory'));
  const repository = join(directory, 'other-repository');
  await mkdir(join(repository, '.git'), { recursive: true });
  await assert.rejects(importReviewDataset(source, repository), code('import_into_another_repository'));
  const link = join(directory, 'public-link');
  await symlink(fileURLToPath(new URL('../eval', import.meta.url)), link);
  await assert.rejects(importReviewDataset(source, link), code('import_requires_ignored_or_external_directory'));
});

test('invalid UTF-8 and invalid JSON fail without exposing data in CLI errors', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'toxiply-invalid-dataset-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'input.json');
  await writeFile(path, Buffer.from([0xff]));
  await assert.rejects(readDatasetText(path), code('invalid_utf8'));
  await writeFile(path, '{ "private": "DO_NOT_ECHO"');
  const result = spawnSync(process.execPath, ['eval/run-review.mjs', 'validate', path], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stderr).error, 'invalid_json');
  assert.ok(!result.stderr.includes('DO_NOT_ECHO'));
});

test('validation CLI prints only manifest metadata and comparison CLI includes coverage reports', () => {
  const path = fileURLToPath(new URL('../eval/text-review.example.v1.json', import.meta.url));
  const validation = spawnSync(process.execPath, ['eval/run-review.mjs', 'validate', path], { encoding: 'utf8' });
  assert.equal(validation.status, 0);
  assert.equal(JSON.parse(validation.stdout).cases, 7);
  assert.ok(!validation.stdout.includes('Try me.'));
  const comparison = spawnSync(process.execPath, ['eval/run-review.mjs', 'compare', path], { encoding: 'utf8' });
  assert.equal(comparison.status, 0);
  assert.equal(JSON.parse(comparison.stdout).reports[0].baseline.statusCounts.unsupported, 2);
});

test('CLI import is immutable and argument errors have stable, bounded codes', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'toxiply-cli-import-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = fileURLToPath(new URL('../eval/text-review.example.v1.json', import.meta.url));
  const run = (...args) => spawnSync(process.execPath, ['eval/run-review.mjs', ...args], { encoding: 'utf8' });
  const imported = run('import', source, directory, '--reference', source);
  assert.equal(imported.status, 0);
  assert.equal(await readFile(JSON.parse(imported.stdout).destination, 'utf8'), exampleText);
  const duplicate = run('import', source, directory);
  assert.equal(duplicate.status, 1);
  assert.equal(JSON.parse(duplicate.stderr).error, 'dataset_version_exists');
  for (const args of [['unknown'], ['validate'], ['compare', '--reference'], ['compare', 'one', 'two']]) {
    const invalid = run(...args);
    assert.equal(invalid.status, 1);
    assert.match(JSON.parse(invalid.stderr).error, /^invalid_/);
  }
});
