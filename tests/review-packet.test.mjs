/**
 * Company: EonHive Inc. | Title: Annotation handoff regressions
 * Purpose: Verify prediction-free packets, explicit review declarations and immutable revisions.
 * Author: Stan Nesi | Created: 2026-11-01 | Updated: 2026-11-01
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadReviewDataset, sha256, writePrivateArtifact } from '../eval/review-dataset.mjs';
import { applyReviewResponse, prepareResponseTemplate, prepareReviewPacket, reviewJson } from '../eval/review-packet.mjs';

const sourcePath = fileURLToPath(new URL('../eval/text-review.example.v1.json', import.meta.url));
const sourceText = await readFile(sourcePath, 'utf8');
const source = JSON.parse(sourceText);
const packet = prepareReviewPacket(sourceText);
const packetText = reviewJson(packet);
const template = prepareResponseTemplate(packetText);
const code = (expected) => (error) => error.code === expected;
const run = (...args) => spawnSync(process.execPath, ['eval/run-review.mjs', ...args], { encoding: 'utf8' });

// Fictional schema fixtures only: this helper is not independent human annotation.
function declaredResponse() {
  const response = structuredClone(template);
  response.datasetVersion = 'schema-review-2';
  response.reviewer = 'schema-only-reviewer';
  response.independentOfDevelopment = true;
  response.annotations.forEach((item, index) => {
    item.labels = structuredClone(source.cases[index].labels);
    item.rationale = 'Fictional schema-test declaration, not actual human review.';
    item.reviewedAt = '2026-11-01T12:00:00.000Z';
    item.evidenceSpans = structuredClone(source.cases[index].evidenceSpans ?? []);
  });
  return response;
}
const apply = (response) => applyReviewResponse(sourceText, packetText, reviewJson(response));

test('packets are deterministic and omit labels, rationales, spans, grouping and source IDs', () => {
  assert.deepEqual(prepareReviewPacket(sourceText), packet);
  assert.deepEqual(Object.keys(packet).sort(), ['cases', 'labelDefinition', 'schemaVersion', 'source', 'taxonomyVersion']);
  assert.equal(packet.source.datasetSha256, sha256(sourceText));
  packet.cases.forEach((item, index) => {
    assert.deepEqual(Object.keys(item), ['id', 'request']);
    assert.equal(item.id, `case-${String(index + 1).padStart(5, '0')}`);
    assert.deepEqual(item.request, { ...source.cases[index].request, requestId: item.id });
    assert.ok(!packetText.includes(source.cases[index].id));
  });
  assert.equal(loadReviewDataset(sourceText).dataset.reviewStatus, 'provisional');
});

test('response templates contain blank labels and attestations and cannot qualify as review', () => {
  assert.equal(template.packetSha256, sha256(packetText));
  assert.equal(template.reviewer, null);
  assert.equal(template.independentOfDevelopment, null);
  assert.equal(template.datasetVersion, null);
  template.annotations.forEach((item, index) => {
    assert.deepEqual(Object.keys(item.labels), source.cases[index].request.categories);
    assert.ok(Object.values(item.labels).every((value) => value === null));
    assert.equal(item.rationale, null);
    assert.equal(item.reviewedAt, null);
    assert.deepEqual(item.evidenceSpans, []);
  });
  assert.throws(() => apply(template), code('invalid_review_response'));
});

test('reconciliation records label changes and hashes without changing original inputs or split', () => {
  const response = declaredResponse();
  response.annotations[0].labels.harassment = true;
  response.annotations[0].evidenceSpans = [{ category: 'harassment', source: 'text', start: 0, end: 6 }];
  response.annotations.reverse(); // IDs, not response order, determine attribution.
  const { datasetText, audit } = apply(response);
  const revised = loadReviewDataset(datasetText).dataset;
  assert.equal(revised.datasetVersion, response.datasetVersion);
  assert.equal(revised.reviewStatus, 'human_reviewed');
  assert.equal(revised.split, 'development');
  assert.deepEqual(revised.provenance, source.provenance);
  revised.cases.forEach((item, index) => {
    assert.equal(item.id, source.cases[index].id);
    assert.deepEqual(item.request, source.cases[index].request);
    assert.deepEqual(item.tags, source.cases[index].tags);
    assert.equal(item.group, source.cases[index].group);
    assert.equal(item.review.reviewer, response.reviewer);
  });
  assert.equal(revised.cases[0].labels.harassment, true);
  assert.equal(audit.sourceDatasetSha256, sha256(sourceText));
  assert.equal(audit.packetSha256, sha256(packetText));
  assert.equal(audit.responseSha256, sha256(reviewJson(response)));
  assert.equal(audit.datasetSha256, sha256(datasetText));
  assert.equal(audit.changedLabels, 1);
  assert.deepEqual(audit.changes[0].labels, [{ category: 'harassment', before: false, after: true }]);
  assert.equal(audit.changes[0].evidenceSpansChanged, true);
  assert.match(audit.attestations, /does not verify identity/);
  assert.deepEqual(JSON.parse(sourceText), source);
  assert.deepEqual(apply(response), { datasetText, audit });
});

test('omitting annotations removes old provisional span claims rather than carrying them forward', () => {
  const response = declaredResponse();
  response.annotations.forEach((item) => { item.evidenceSpans = []; });
  const { datasetText, audit } = apply(response);
  assert.deepEqual(JSON.parse(datasetText).cases[5].evidenceSpans, []);
  assert.equal(audit.changes[5].evidenceSpansChanged, true);
  assert.equal(audit.changedLabels, 0);
});

for (const [name, mutate, expected] of [
  ['different response schema', (r) => { r.schemaVersion = 'future'; }, 'invalid_review_response'],
  ['unknown response field', (r) => { r.predictions = []; }, 'invalid_review_response'],
  ['wrong packet hash', (r) => { r.packetSha256 = '0'.repeat(64); }, 'review_packet_hash_mismatch'],
  ['same dataset version', (r) => { r.datasetVersion = source.datasetVersion; }, 'review_requires_new_version'],
  ['undeclared independence', (r) => { r.independentOfDevelopment = false; }, 'invalid_review_response'],
  ['dataset author as reviewer', (r) => { r.reviewer = 'codex'; }, 'invalid_dataset'],
  ['missing case', (r) => { r.annotations.pop(); }, 'review_case_mismatch'],
  ['duplicate case', (r) => { r.annotations[1] = r.annotations[0]; }, 'review_case_mismatch'],
  ['unknown case', (r) => { r.annotations[0].id = 'unknown'; }, 'review_case_mismatch'],
  ['missing category label', (r) => { r.annotations[0].labels = {}; }, 'invalid_dataset'],
  ['extra category label', (r) => { r.annotations[0].labels.threat = false; }, 'invalid_dataset'],
  ['undecided category label', (r) => { r.annotations[0].labels.harassment = null; }, 'invalid_review_response'],
  ['missing rationale', (r) => { r.annotations[0].rationale = ' '; }, 'invalid_review_response'],
  ['missing timestamp', (r) => { delete r.annotations[0].reviewedAt; }, 'invalid_review_response'],
  ['no explicit span decision', (r) => { delete r.annotations[0].evidenceSpans; }, 'invalid_review_response'],
  ['absent source', (r) => { r.annotations[5].evidenceSpans[0].source = 'quotedText'; }, 'invalid_dataset'],
  ['negative category span', (r) => { r.annotations[5].labels.threat = false; }, 'invalid_dataset'],
  ['out-of-bounds span', (r) => { r.annotations[5].evidenceSpans[0].end = 999; }, 'invalid_dataset'],
  ['split surrogate', (r) => { r.annotations[5].evidenceSpans[1].start = 1; }, 'invalid_dataset'],
  ['fabricated split promotion', (r) => { r.split = 'held_out'; }, 'invalid_review_response'],
]) {
  test(`reconciliation rejects ${name}`, () => {
    const response = declaredResponse();
    mutate(response);
    assert.throws(() => apply(response), code(expected));
  });
}

test('packet binding rejects edited content, context, ordering and source bytes', () => {
  for (const mutate of [
    (p) => { p.cases[0].request.content.text = 'Edited text.'; },
    (p) => { p.cases[5].request.context.parentText = 'Edited parent.'; },
    (p) => { p.cases[0].request.categories = ['threat']; },
    (p) => { p.cases.reverse(); },
    (p) => { p.source.datasetSha256 = '0'.repeat(64); },
  ]) {
    const changed = structuredClone(packet);
    mutate(changed);
    assert.throws(() => applyReviewResponse(sourceText, reviewJson(changed), reviewJson(declaredResponse())),
      (error) => ['review_packet_source_mismatch', 'invalid_review_packet'].includes(error.code));
  }
  assert.throws(() => applyReviewResponse(`${sourceText}\n`, packetText, reviewJson(declaredResponse())),
    code('review_packet_source_mismatch'));
  assert.throws(() => applyReviewResponse(sourceText, `${packetText}\n`, reviewJson(declaredResponse())),
    code('review_packet_hash_mismatch'));
});

test('legacy diagnostics require explicit provenance before preparing a packet', async () => {
  const legacy = await readFile(new URL('../eval/native-text.v1.json', import.meta.url), 'utf8');
  assert.throws(() => prepareReviewPacket(legacy), code('review_requires_text_eval_v1'));
  assert.throws(() => prepareResponseTemplate('{'), code('invalid_json'));
  const invalid = structuredClone(packet);
  invalid.cases[0].request.requestId = 'different';
  assert.throws(() => prepareResponseTemplate(reviewJson(invalid)), code('invalid_review_packet'));
});

test('held-out revisions preserve freeze metadata and still require disjoint development references', () => {
  // These declarations only exercise a schema path, not a real held-out corpus.
  const held = structuredClone(source);
  held.split = 'held_out';
  held.reviewStatus = 'human_reviewed';
  held.provenance.sourceKind = 'independent_collection';
  held.holdout = { frozenAt: '2026-11-01T10:00:00.000Z', notUsedForDevelopment: true };
  held.cases = [held.cases[0]];
  held.cases[0].request.content.text = 'Fictional disjoint schema path.';
  held.cases[0].review = { status: 'human_reviewed', reviewer: 'schema-only-reviewer',
    reviewedAt: '2026-11-01T12:00:00.000Z', independentOfDevelopment: true };
  const heldText = reviewJson(held);
  assert.throws(() => prepareReviewPacket(heldText), code('held_out_requires_development_reference'));
  const heldPacket = reviewJson(prepareReviewPacket(heldText, [sourceText]));
  const response = declaredResponse();
  response.packetSha256 = sha256(heldPacket);
  response.annotations = [response.annotations[0]];
  const revised = applyReviewResponse(heldText, heldPacket, reviewJson(response), [sourceText]);
  assert.deepEqual(JSON.parse(revised.datasetText).holdout, held.holdout);
  assert.equal(revised.audit.split, 'held_out');
  assert.deepEqual(revised.audit.referenceHashes, [sha256(sourceText)]);
  const overlap = structuredClone(source);
  overlap.cases[0].request.content.text = held.cases[0].request.content.text;
  assert.throws(() => prepareReviewPacket(heldText, [reviewJson(overlap)]), code('held_out_content_overlap'));
});

test('CLI handoff creates private immutable files and a reproducible reconciliation receipt', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'toxiply-review-packet-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const prepared = run('prepare-review', sourcePath, directory);
  assert.equal(prepared.status, 0, prepared.stderr);
  const packetPath = JSON.parse(prepared.stdout).destination;
  assert.equal(await readFile(packetPath, 'utf8'), packetText);
  assert.equal((await stat(packetPath)).mode & 0o777, 0o600);
  assert.ok(!prepared.stdout.includes('Try me.'));
  assert.equal(run('prepare-review', sourcePath, directory).status, 1);
  const templated = run('review-template', packetPath, directory);
  assert.equal(templated.status, 0, templated.stderr);
  const templatePath = JSON.parse(templated.stdout).destination;
  assert.deepEqual(JSON.parse(await readFile(templatePath, 'utf8')), template);
  assert.equal(run('apply-review', sourcePath, packetPath, templatePath, directory).status, 1);
  const responsePath = join(directory, 'fictional-response.json');
  const responseText = reviewJson(declaredResponse());
  await writeFile(responsePath, responseText);
  const applied = run('apply-review', sourcePath, packetPath, responsePath, directory, '--reference', sourcePath);
  assert.equal(applied.status, 0, applied.stderr);
  const receipt = JSON.parse(applied.stdout);
  assert.equal(sha256(await readFile(receipt.destination, 'utf8')), receipt.datasetSha256);
  assert.equal(receipt.responseSha256, sha256(responseText));
  assert.equal(receipt.split, 'development');
  assert.equal((await stat(receipt.destination)).mode & 0o777, 0o600);
  const repeated = run('apply-review', sourcePath, packetPath, responsePath, directory);
  assert.equal(repeated.status, 1);
  assert.equal(JSON.parse(repeated.stderr).error, 'dataset_version_exists');
  assert.equal(await readFile(sourcePath, 'utf8'), sourceText);
});

test('private writer rejects public/symlinked/other Git paths and unsafe filenames', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'toxiply-review-destination-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const publicDirectory = fileURLToPath(new URL('../eval', import.meta.url));
  const otherGit = join(directory, 'other-git');
  await mkdir(otherGit);
  await writeFile(join(otherGit, '.git'), 'gitdir: /fictional/worktree');
  const link = join(directory, 'public-link');
  await symlink(publicDirectory, link);
  for (const target of [publicDirectory, link]) {
    await assert.rejects(writePrivateArtifact(target, 'test.json', '{}'),
      code('import_requires_ignored_or_external_directory'));
  }
  await assert.rejects(writePrivateArtifact(otherGit, 'test.json', '{}'), code('import_into_another_repository'));
  await assert.rejects(writePrivateArtifact(directory, '../escape.json', '{}'), code('invalid_artifact_name'));
  await mkdir(join(directory, 'exists.json'));
  await assert.rejects(writePrivateArtifact(directory, 'exists.json', '{}'), code('review_artifact_exists'));
});

test('CLI errors omit private content, hostile keys and paths and reject incomplete arguments', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'toxiply-private-errors-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const packetPath = join(directory, 'packet.json');
  const responsePath = join(directory, 'response.json');
  await writeFile(packetPath, packetText);
  const response = declaredResponse();
  response.annotations[0].labels.PRIVATE_DO_NOT_ECHO = 'PRIVATE_DO_NOT_ECHO';
  await writeFile(responsePath, reviewJson(response));
  const invalid = run('apply-review', sourcePath, packetPath, responsePath, directory);
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stderr).error, 'invalid_review_response');
  assert.ok(!invalid.stderr.includes('PRIVATE_DO_NOT_ECHO'));
  assert.ok(!invalid.stderr.includes(directory));
  for (const args of [['prepare-review', sourcePath], ['review-template', packetPath],
    ['apply-review', sourcePath, packetPath, responsePath]]) {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stderr).error, 'invalid_arguments');
  }
});
