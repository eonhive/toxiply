/**
 * Company: EonHive Inc. | Title: Native evaluation and compatibility harness tests
 * Purpose: Validate diagnostic failures and explicit legacy differences using public synthetic probes.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { analyze } from '@eonhive/toxiply';
import { evaluateNativeDataset } from '../eval/evaluate-native.mjs';
import { compareLegacyReport } from '../eval/compare-legacy.mjs';
import { analyzeNativeContent } from '../dist/native/analyze-native-content.js';

const datasetText = await readFile(new URL('../eval/native-text.v1.json', import.meta.url), 'utf8');
const dataset = JSON.parse(datasetText);

test('native evaluation is deterministic and retains known false positives and misses', async () => {
  const first = await evaluateNativeDataset(datasetText);
  assert.deepEqual(first, await evaluateNativeDataset(datasetText));
  assert.equal(first.labelReview, 'pending_human_review');
  assert.equal(first.totals.cases, 32);
  assert.ok(first.mismatches.includes('report-1'));
  assert.ok(first.mismatches.includes('evasion-1'));
  assert.equal(Object.values(first.groups).reduce((sum, group) => sum + group.cases, 0), 32);
  assert.ok(Object.values(first.categories).every((group) => group.cases === 32));
});

test('native evaluation aborts unsupported analysis instead of counting benign', async () => {
  await assert.rejects(evaluateNativeDataset(datasetText, { analyze }), /did not complete/);
  const changed = { ...dataset, cases: [{ ...dataset.cases[0], context: { languageHint: 'fr' } }] };
  await assert.rejects(evaluateNativeDataset(JSON.stringify(changed)), /did not complete/);
});

test('native evaluation rejects duplicate or invalid expected categories and context', async () => {
  for (const cases of [[], [dataset.cases[0], dataset.cases[0]],
    [{ ...dataset.cases[0], expectedCategories: ['spam_scam'] }],
    [{ ...dataset.cases[0], expectedCategories: ['threat', 'threat'] }],
    [{ ...dataset.cases[0], context: { replyTarget: 'admin' } }]]) {
    await assert.rejects(evaluateNativeDataset(JSON.stringify({ ...dataset, cases })));
  }
});

// These are independently authored harness inputs, not transferred Flaggr
// fixtures. Private frozen fixtures are compared only by the local CLI.
function legacyFixture(changes = {}) {
  const signals = analyzeNativeContent({ text: 'I will hurt you.', language: 'en' });
  return {
    dataset: { version: 'public-harness-probe', sha256: 'a'.repeat(64), provenance: 'Independent synthetic harness probe; not a frozen Flaggr fixture.' },
    results: [{ id: 'public-probe', category: 'threat', text: 'I will hurt you.', expectedFlag: true,
      signals: { ...signals, routerVersion: 'fixture-planner', ...changes } }],
  };
}

test('legacy harness reports matching scores/severity separately from intentional metadata', async () => {
  const report = await compareLegacyReport(JSON.stringify(legacyFixture()));
  assert.equal(report.totals.matchingContent, 1);
  assert.equal(report.totals.matchingPublicCategories, 1);
  assert.equal(report.totals.severityDifferences, 0);
  assert.deepEqual(report.cases[0].intentionalDifferences, ['planner_identifier']);
  assert.ok(report.notExposedInPublicV1.includes('severity'));
});

test('legacy category and severity differences are reported rather than normalized away', async () => {
  const fixture = legacyFixture({ severity: 'low' });
  fixture.results[0].signals.scores.threat = 0.2;
  const report = await compareLegacyReport(JSON.stringify(fixture));
  assert.equal(report.totals.matchingContent, 0);
  assert.equal(report.totals.categoryDifferences, 1);
  assert.equal(report.totals.severityDifferences, 1);
  assert.deepEqual(report.cases[0].categoryDifferences, [{ category: 'threat', legacy: 0.2, actual: 0.98 }]);
});

test('media/provider legacy concepts stay unsupported without incomplete shape coercion', async () => {
  for (const changes of [{ externalUsed: true }, { sourceModalities: ['image'] }]) {
    const report = await compareLegacyReport(JSON.stringify(legacyFixture(changes)));
    assert.equal(report.totals.unsupported, 1);
    assert.equal(report.totals.compared, 0);
    assert.equal(report.nativeDiagnostic.cases, 0);
    assert.equal(report.cases[0].status, 'unsupported');
  }
});

test('legacy bounds and unsupported context are reported without pretending parity', async () => {
  const fixture = legacyFixture();
  fixture.results[0].conversation = { parentText: 'x'.repeat(4_001) };
  const report = await compareLegacyReport(JSON.stringify(fixture));
  assert.equal(report.totals.unsupported, 1);
  assert.equal(report.cases[0].reason, 'outside_bounded_v1_request');
});

test('unknown legacy content concepts fail validation rather than being silently dropped', async () => {
  const fixture = legacyFixture({ futureRisk: 0.8 });
  await assert.rejects(compareLegacyReport(JSON.stringify(fixture)), /Unrecognized key/);
});

test('legacy quoted-report false positives remain explicit attribution problems', async () => {
  const fixture = legacyFixture();
  fixture.results[0].category = 'quoted_reporting';
  fixture.results[0].expectedFlag = false;
  const report = await compareLegacyReport(JSON.stringify(fixture));
  assert.equal(report.totals.attributionWarnings, 1);
  assert.equal(report.nativeDiagnostic.falsePositives, 1);
});
