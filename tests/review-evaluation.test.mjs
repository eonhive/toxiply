/**
 * Company: EonHive Inc. | Title: Coverage-aware evaluation regressions
 * Purpose: Verify confusion denominators, paired errors, source witnesses and execution failures.
 * Author: Stan Nesi | Created: 2026-10-31 | Updated: 2026-10-31
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { analyze, createAnalyzer } from '@eonhive/toxiply';
import { compareQualityDataset } from '../eval/compare-quality.mjs';
import { compareReviewedDataset, evaluateReviewedDataset } from '../eval/evaluate-reviewed.mjs';

const exampleText = await readFile(new URL('../eval/text-review.example.v1.json', import.meta.url), 'utf8');
const example = JSON.parse(exampleText);
function dataset(cases = [example.cases[0]]) { return JSON.stringify({ ...example, cases }); }
function fixture(positive = false, supportsContext = true) {
  return createAnalyzer({
    descriptor: { id: 'evaluation-fixture', version: 'fixture-v1', categories: ['harassment'],
      languages: ['en'], supportsContext },
    analyze: () => ({ findings: [{ category: 'harassment', score: positive ? 1 : 0,
      evidenceIds: positive ? ['e1'] : [] }], evidence: positive ? [
      { id: 'e1', code: 'fixture.synthetic', source: 'text', start: 0, end: 1 },
    ] : [] }),
  });
}

test('new reporting reproduces both frozen paired diagnostics without changing labels or versions', async () => {
  for (const name of ['native-text.v1.json', 'context-attribution.v1.json']) {
    const text = await readFile(new URL(`../eval/${name}`, import.meta.url), 'utf8');
    const previous = await compareQualityDataset(text);
    const current = await compareReviewedDataset(text);
    assert.equal(current.dataset.datasetSha256, previous.datasetSha256);
    for (const model of ['baseline', 'candidate']) {
      assert.deepEqual(current[model].categories.toxicity.falsePositives, previous[model].categories.toxicity.falsePositives);
      for (const key of ['truePositives', 'trueNegatives', 'falsePositives', 'falseNegatives', 'precision', 'recall']) {
        assert.equal(current[model].totals[key], previous[model].totals[key]);
      }
      assert.deepEqual(current[model].observedVersions[0].modelVersions, previous[model].modelVersions);
      assert.equal(current[model].evidence.invalid, 0);
      assert.equal(current[model].evidence.annotatedSpanRecall, null);
    }
    for (const key of Object.keys(previous.totals)) assert.equal(current.totals[key], previous.totals[key]);
    assert.deepEqual(current, await compareReviewedDataset(text));
  }
});

test('unsupported and partial results never count as successful whole-case negatives', async () => {
  const report = await compareReviewedDataset(exampleText);
  assert.deepEqual(report.baseline.statusCounts, { completed: 4, partial: 1, unsupported: 2, failed: 0, invalid_result: 0 });
  assert.equal(report.baseline.totals.cases, 4);
  assert.equal(report.baseline.totals.unassessedCases, 3);
  assert.equal(report.baseline.categories.harassment.unassessed, 1);
  assert.equal(report.baseline.categories.spam_scam.cases, 0);
  assert.equal(report.baseline.categories.spam_scam.unassessed, 2);
  assert.equal(report.baseline.categories.spam_scam.precision, null);
  assert.equal(report.baseline.languages.fr.cases, 0);
  assert.equal(report.baseline.languages.fr.unsupported, 1);
  assert.equal(report.baseline.cases.find((item) => item.id === 'partial-categories').actualPresent, null);
  assert.equal(report.totals.comparableCases, 4);
  assert.equal(report.totals.uncomparableCases, 3);
  assert.equal(report.executionFailed, false);
});

test('unsupported semantic context excludes otherwise returned category scores from quality metrics', async () => {
  const item = structuredClone(example.cases[0]);
  item.request.context.parentText = 'Required semantic context.';
  item.labels.harassment = true;
  const report = await evaluateReviewedDataset(dataset([item]), fixture(true, false));
  assert.equal(report.cases[0].status, 'partial');
  assert.equal(report.cases[0].findings[0].score, 1);
  assert.equal(report.categories.harassment.cases, 0);
  assert.equal(report.categories.harassment.unassessed, 1);
  assert.equal(report.totals.truePositives, 0);
});

test('a declared partial result never enters whole-case confusion even when it returns every category', async () => {
  const engine = fixture();
  const report = await evaluateReviewedDataset(dataset(), { async analyze(request) {
    const result = await engine.analyze(request);
    result.status = 'partial';
    result.missingCapabilities = [{ capability: 'text_analysis', reason: 'not_supported' }];
    return result;
  } });
  assert.equal(report.totals.cases, 0);
  assert.equal(report.totals.trueNegatives, 0);
  assert.equal(report.categories.harassment.trueNegatives, 1);
  assert.equal(report.cases[0].actualPresent, null);
});

test('paired reports count both fixes and regressions on genuinely comparable labels', async () => {
  const items = [false, true, true, false].map((positive, index) => {
    const item = structuredClone(example.cases[0]);
    item.id = item.request.requestId = `metric-${index}`;
    item.labels.harassment = positive;
    return item;
  });
  function predictions(values) {
    return { analyze(request) { return fixture(values[Number(request.requestId.at(-1))]).analyze(request); } };
  }
  const report = await compareReviewedDataset(dataset(items), [], {
    baseline: predictions([true, true, false, false]), candidate: predictions([false, false, true, true]),
  });
  assert.deepEqual(report.totals, { fixedFalsePositives: 1, newFalsePositives: 1,
    fixedFalseNegatives: 1, newFalseNegatives: 1, categoryImprovements: 2, categoryRegressions: 2,
    comparableCases: 4, uncomparableCases: 0 });
  assert.deepEqual(report.candidate.categories.harassment.falsePositiveIds, ['metric-3']);
  assert.deepEqual(report.candidate.categories.harassment.falseNegativeIds, ['metric-1']);
});

test('structural source validity is separate from reference-span alignment', async () => {
  const item = structuredClone(example.cases[0]);
  item.request.content.text = 'A harmful phrase.';
  item.labels.harassment = true;
  item.evidenceSpans = [{ category: 'harassment', source: 'text', start: 2, end: 9 }];
  const report = await evaluateReviewedDataset(dataset([item]), fixture(true));
  assert.equal(report.evidence.structuralValidity, 1);
  assert.equal(report.evidence.annotatedLinkPrecision, 0);
  assert.equal(report.evidence.annotatedSpanRecall, 0);
  assert.equal(report.totals.truePositives, 1);
});

test('native parent evidence aligns to original UTF-16 fields and supplied provisional annotations', async () => {
  const report = await evaluateReviewedDataset(dataset([example.cases[5]]));
  assert.equal(report.evidence.annotatedSpans, 2);
  assert.equal(report.evidence.matchedAnnotations, 2);
  assert.equal(report.evidence.structuralValidity, 1);
  assert.equal(report.evidence.annotatedSpanRecall, 1);
  const parent = report.cases[0].evidence.find((entry) => entry.source === 'parentText');
  assert.deepEqual([parent.start, parent.end], [10, 14]);
  assert.equal(example.cases[5].request.context.parentText.slice(parent.start, parent.end), 'hurt');
});

test('failed, malformed and throwing analyzers are explicit and never create quality negatives', async () => {
  const invalidCore = createAnalyzer({ descriptor: { id: 'fixture', version: 'v1',
    categories: ['harassment'], languages: ['en'], supportsContext: true },
  analyze() { throw new Error('PRIVATE_EXCEPTION'); } });
  for (const engine of [invalidCore, { async analyze() { return {}; } },
    { async analyze() { throw new Error('PRIVATE_EXCEPTION'); } }]) {
    const report = await compareReviewedDataset(dataset(), [], { candidate: engine });
    assert.equal(report.executionFailed, true);
    assert.equal(report.candidate.totals.cases, 0);
    assert.equal(report.candidate.totals.trueNegatives, 0);
    assert.equal(report.candidate.executionFailures.length, 1);
    assert.ok(!JSON.stringify(report).includes('PRIVATE_EXCEPTION'));
  }
  const unconfigured = await evaluateReviewedDataset(dataset(), { analyze });
  assert.equal(unconfigured.statusCounts.unsupported, 1);
  assert.deepEqual(unconfigured.observedVersions, []);
});

for (const [name, mutate] of [
  ['out-of-source offsets', (result, request) => { result.evidence[0].end = request.content.text.length + 1; }],
  ['wrong source field', (result) => { result.evidence[0].source = 'parentText'; }],
  ['wrong request ID', (result) => { result.requestId = 'different'; }],
  ['wrong language', (result) => { result.coverage.language = 'fr'; }],
]) {
  test(`independent result audit rejects ${name}`, async () => {
    const engine = fixture(true);
    const report = await evaluateReviewedDataset(dataset(), { async analyze(request) {
      const result = await engine.analyze(request);
      mutate(result, request);
      return result;
    } });
    assert.equal(report.executionFailures.length, 1);
    assert.equal(report.totals.cases, 0);
    assert.equal(report.categories.harassment.trueNegatives, 0);
  });
}

test('unassessed gold evidence and no comparable categories stay explicit rather than zero-accuracy claims', async () => {
  const report = await evaluateReviewedDataset(dataset([example.cases[5]]), { analyze });
  assert.equal(report.evidence.unassessedAnnotations, 2);
  assert.equal(report.evidence.annotatedSpanRecall, null);
  assert.equal(report.evidence.structuralValidity, null);
});

test('version changes abort the evaluation rather than aggregate different analyzers', async () => {
  const engine = fixture();
  let version = 0;
  const other = structuredClone(example.cases[0]);
  other.id = other.request.requestId = 'second-case';
  await assert.rejects(evaluateReviewedDataset(dataset([example.cases[0], other]), { async analyze(request) {
    const result = await engine.analyze(request);
    result.modelVersions['evaluation-fixture'] = `v${version++}`;
    return result;
  } }), (error) => error.code === 'inconsistent_analyzer_versions');
});
