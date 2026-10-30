/**
 * Company: EonHive Inc. | Title: Diagnostic evaluation tests
 * Purpose: Verify confusion metrics, deterministic reporting, and failure handling.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { analyze, createAnalyzer } from '@eonhive/toxiply';
import { evaluateDataset } from '../eval/evaluate.mjs';

const datasetText = await readFile(new URL('../eval/english-profanity.v1.json', import.meta.url), 'utf8');
const dataset = JSON.parse(datasetText);

function fakeEngine(predictions, behavior = {}) {
  return createAnalyzer({
    descriptor: { id: 'evaluation-fixture', version: 'v1', categories: ['profanity'], languages: ['en'], supportsContext: false },
    analyze(request) {
      if (behavior.throw) throw new Error('Synthetic execution failure.');
      const positive = predictions[request.requestId];
      return {
        findings: [{ category: 'profanity', score: positive ? 1 : 0, evidenceIds: positive ? ['e1'] : [] }],
        evidence: positive ? [{ id: 'e1', code: 'fixture.synthetic', source: 'text', start: 0, end: 1 }] : [],
      };
    },
  });
}

function metricDataset(labels) {
  return JSON.stringify({
    ...dataset,
    cases: labels.map((expectedPresent, index) => ({
      id: `case-${index}`, group: 'literal', text: 'Synthetic metric input.',
      expectedPresent, rationale: 'Explicit test label independent of prediction.',
    })),
  });
}

test('confusion metrics count true/false positives and negatives independently', async () => {
  const report = await evaluateDataset(metricDataset([true, false, false, true]), fakeEngine({
    'case-0': true, 'case-1': false, 'case-2': true, 'case-3': false,
  }));
  assert.deepEqual(report.totals, {
    cases: 4, truePositives: 1, trueNegatives: 1, falsePositives: 1, falseNegatives: 1,
    precision: 0.5, recall: 0.5, falsePositiveRate: 0.5, falseNegativeRate: 0.5,
  });
  assert.deepEqual(report.groups.literal, report.totals);
  assert.deepEqual(report.mismatches, ['case-2', 'case-3']);
});

test('undefined precision/recall denominators are null rather than invented measurements', async () => {
  const report = await evaluateDataset(metricDataset([false]), fakeEngine({ 'case-0': false }));
  assert.equal(report.totals.precision, null);
  assert.equal(report.totals.recall, null);
  assert.equal(report.totals.falseNegativeRate, null);
  assert.equal(report.totals.falsePositiveRate, 0);
});

test('unavailable or failed analysis aborts evaluation instead of being counted benign', async () => {
  await assert.rejects(evaluateDataset(datasetText, { analyze }), /completed binary/);
  await assert.rejects(evaluateDataset(datasetText, fakeEngine({}, { throw: true })), /completed binary/);
});

test('duplicate IDs, invalid labels, and empty datasets fail validation', async () => {
  for (const changed of [
    { ...dataset, cases: [] },
    { ...dataset, cases: [dataset.cases[0], dataset.cases[0]] },
    { ...dataset, cases: [{ ...dataset.cases[0], expectedPresent: 'yes' }] },
  ]) {
    await assert.rejects(evaluateDataset(JSON.stringify(changed)));
  }
});

test('reviewed status requires attributed review metadata', async () => {
  await assert.rejects(evaluateDataset(JSON.stringify({
    ...dataset, labelReview: { status: 'reviewed', reviewer: null, reviewedAt: null },
  })));
  const report = await evaluateDataset(datasetText);
  assert.deepEqual(report.labelReview, { status: 'pending_human_review', reviewer: null, reviewedAt: null });
});

test('dataset, versions, evidence and all category reports are deterministic', async () => {
  const first = await evaluateDataset(datasetText);
  const second = await evaluateDataset(datasetText);
  assert.deepEqual(first, second);
  assert.match(first.datasetSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(first.modelVersions, { 'english-literal-profanity': 'literal-en-v1' });
  assert.equal(first.totals.cases, dataset.cases.length);
  assert.equal(first.cases.length, dataset.cases.length);
  assert.equal(Object.values(first.groups).reduce((sum, group) => sum + group.cases, 0), first.totals.cases);
  // This diagnostic deliberately exposes lexical misses; do not relabel them to
  // create an apparent quality pass. Contract tests cover the intended algorithm.
  assert.ok(first.mismatches.includes('obfuscated-01'));
  assert.ok(first.mismatches.includes('unlisted-01'));
  for (const outcome of first.cases) {
    const source = dataset.cases.find((item) => item.id === outcome.id).text;
    for (const evidence of outcome.evidence) {
      assert.equal(evidence.source, 'text');
      assert.ok(source.slice(evidence.start, evidence.end).length > 0);
    }
  }
});

test('version changes between cases abort evaluation', async () => {
  const engine = fakeEngine({});
  let calls = 0;
  const changingEngine = { async analyze(request) {
    const result = await engine.analyze(request);
    result.modelVersions['evaluation-fixture'] = `v${++calls}`;
    return result;
  } };
  await assert.rejects(evaluateDataset(metricDataset([false, false]), changingEngine), /versions changed/);
});
