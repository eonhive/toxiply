/**
 * Company: EonHive Inc. | Title: Paired quality evaluation tests
 * Purpose: Verify measured improvements and regressions without changing frozen labels.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { analyze, createAnalyzer } from '@eonhive/toxiply';
import { compareQualityDataset } from '../eval/compare-quality.mjs';
import { NATIVE_CATEGORIES } from '../eval/evaluate-native.mjs';

const frozenText = await readFile(new URL('../eval/native-text.v1.json', import.meta.url), 'utf8');
const challengeText = await readFile(new URL('../eval/context-attribution.v1.json', import.meta.url), 'utf8');

test('original diagnostic labels and corpus remain frozen', () => {
  assert.equal(createHash('sha256').update(frozenText).digest('hex'), '9d8f5dcd196a565b03c618af00cc5f4f5d4f658666183c612248b3f577eb3a34');
});

test('paired comparisons are deterministic and preserve explicit provisional provenance', async () => {
  const first = await compareQualityDataset(challengeText);
  assert.deepEqual(first, await compareQualityDataset(challengeText));
  assert.equal(first.labelReview, 'pending_human_review');
  assert.equal(first.validationStatus, 'provisional_development_diagnostics_only');
  assert.deepEqual(first.candidate.modelVersions, { contextual_content: 'contextual-attribution-v1' });
  assert.deepEqual(first.baseline.modelVersions, { native_content: 'native-content-heuristic-v2.evidence-v1' });
});

test('frozen diagnostic retains its positive detections and known misses', async () => {
  const result = await compareQualityDataset(frozenText);
  assert.equal(result.totals.newFalseNegatives, 0);
  assert.equal(result.totals.newFalsePositives, 0);
  assert.equal(result.totals.categoryRegressions, 0);
  assert.equal(result.candidate.totals.truePositives, result.baseline.totals.truePositives);
  assert.equal(result.candidate.totals.falseNegatives, result.baseline.totals.falseNegatives);
  assert.ok(result.candidate.mismatches.includes('evasion-1'));
  assert.ok(result.candidate.mismatches.includes('threat-4'));
});

test('adversarial positives retain detections while unsupported reporting remains visible', async () => {
  const result = await compareQualityDataset(challengeText);
  assert.equal(result.totals.newFalseNegatives, 0);
  assert.equal(result.totals.categoryRegressions, 0);
  assert.ok(result.candidate.mismatches.includes('reporting-7'));
  assert.ok(result.candidate.mismatches.includes('reporting-8'));
  assert.ok(result.totals.fixedFalsePositives > 0);
});

function fixtureEngine(id, predictions) {
  return createAnalyzer({
    descriptor: { id, version: 'fixture-v1', categories: [...NATIVE_CATEGORIES], languages: ['en'], supportsContext: true },
    analyze(request) {
      const positive = predictions[request.requestId];
      return {
        findings: NATIVE_CATEGORIES.map((category) => ({
          category, score: positive && category === 'harassment' ? 1 : 0,
          evidenceIds: positive && category === 'harassment' ? ['e1'] : [],
        })),
        evidence: positive ? [{ id: 'e1', code: 'fixture.synthetic', source: 'text', start: 0, end: 1 }] : [],
      };
    },
  });
}

test('comparison counts both fixes and new errors using independently specified predictions', async () => {
  const dataset = JSON.stringify({
    ...JSON.parse(frozenText),
    cases: [false, true, true, false].map((positive, index) => ({
      id: `case-${index}`, group: 'fixture', text: 'Synthetic metric fixture.',
      expectedCategories: positive ? ['harassment'] : [], rationale: 'Explicit expected label independent of predictions.',
    })),
  });
  const report = await compareQualityDataset(dataset,
    fixtureEngine('fixture-baseline', { 'case-0': true, 'case-1': true, 'case-2': false, 'case-3': false }),
    fixtureEngine('fixture-candidate', { 'case-0': false, 'case-1': false, 'case-2': true, 'case-3': true }),
  );
  assert.deepEqual(report.totals, {
    fixedFalsePositives: 1, newFalsePositives: 1, fixedFalseNegatives: 1, newFalseNegatives: 1,
    categoryImprovements: 2, categoryRegressions: 2,
  });
  assert.equal(report.changedCases.length, 4);
  assert.deepEqual(report.changedCases[1].regressedCategories, ['harassment']);
});

test('incomplete baseline or candidate analysis fails comparison instead of inventing a benefit', async () => {
  const engine = fixtureEngine('fixture', {});
  await assert.rejects(compareQualityDataset(frozenText, { analyze }, engine), /did not complete/);
  await assert.rejects(compareQualityDataset(frozenText, engine, { analyze }), /did not complete/);
});
