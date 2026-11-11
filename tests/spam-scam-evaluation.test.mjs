/**
 * Company: EonHive Inc. | Title: Spam/scam diagnostic regressions
 * Purpose: Preserve provisional labels and coverage-aware comparisons with source audits.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import test from 'node:test';
import { createAnalyzer, createEnglishSpamScamAnalyzer } from '@eonhive/toxiply';
import { compareReviewedDataset, evaluateReviewedDataset } from '../eval/evaluate-reviewed.mjs';

const text = await readFile(new URL('../eval/english-spam-scam.v1.json', import.meta.url), 'utf8');
const dataset = JSON.parse(text);
const engine = createAnalyzer(createEnglishSpamScamAnalyzer());
const compare = () => compareReviewedDataset(text, [], { candidate: engine });

test('versioned synthetic dataset and report preserve their exact provenance and known errors', async () => {
  const report = await compare();
  assert.equal(report.dataset.datasetSha256, '94280d4d105f9ad240b3cfeb4fbb12a788da2ca1ef32044da28e600b937a87c7');
  assert.equal(report.dataset.datasetVersion, '1.0.0');
  assert.equal(report.dataset.split, 'development');
  assert.equal(report.dataset.reviewStatus, 'provisional');
  assert.equal(report.dataset.provenance.visibility, 'public');
  assert.ok(dataset.cases.every((item) => item.review.status === 'provisional'));
  const metrics = report.candidate.categories.spam_scam;
  assert.deepEqual([metrics.truePositives, metrics.trueNegatives, metrics.falsePositives, metrics.falseNegatives], [15, 23, 5, 5]);
  assert.deepEqual(metrics.falsePositiveIds, ['warning-2', 'warning-3', 'quote-1', 'quote-2', 'satire-2']);
  assert.deepEqual(metrics.falseNegativeIds, ['gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5']);
  assert.equal(report.candidate.groups.education.falsePositives, 2);
  assert.equal(report.candidate.groups.quoted_examples.falsePositives, 2);
  assert.equal(report.candidate.groups.satire_urgency.falsePositives, 1);
  assert.equal(report.candidate.groups.evasion_gaps.falseNegatives, 5);
  assert.deepEqual(report.candidate.observedVersions, [{ engineVersion: '0.2.0',
    modelVersions: { 'english-spam-scam': 'spam-scam-en-v1' } }]);
});

test('unsupported native baseline has no quality denominator or claimed improvements', async () => {
  const report = await compare();
  assert.equal(report.executionFailed, false);
  assert.equal(report.baseline.statusCounts.unsupported, 48);
  assert.equal(report.baseline.totals.cases, 0);
  assert.equal(report.baseline.totals.unassessedCases, 48);
  assert.equal(report.baseline.totals.precision, null);
  assert.equal(report.totals.comparableCases, 0);
  assert.equal(report.totals.uncomparableCases, 48);
  assert.equal(report.totals.fixedFalseNegatives, 0);
  assert.equal(report.candidate.statusCounts.completed, 48);
  assert.equal(report.candidate.totals.unassessedCases, 0);
});

test('evidence is audited separately from unperformed independent semantic review', async () => {
  const report = await compare();
  assert.equal(report.candidate.evidence.checked, 51);
  assert.equal(report.candidate.evidence.invalid, 0);
  assert.equal(report.candidate.evidence.annotatedLinkPrecision, null);
  assert.equal(report.candidate.evidence.annotatedSpanRecall, null);
  assert.equal(Object.values(report.candidate.groups).reduce((sum, item) => sum + item.cases, 0), 48);
  for (const item of report.candidate.cases) {
    assert.equal(item.fullyAssessed, true);
    if (item.actualPresent) assert.ok(item.evidence.length >= 2);
  }
});

test('missing language and semantic context never become assessed benign results', async () => {
  const changed = structuredClone(dataset);
  delete changed.cases[0].request.context;
  changed.cases[1].request.context.parentText = 'An educational quotation.';
  const report = await evaluateReviewedDataset(JSON.stringify(changed), engine);
  assert.equal(report.cases[0].status, 'unsupported');
  assert.equal(report.cases[1].status, 'partial');
  assert.equal(report.cases[0].actualPresent, null);
  assert.equal(report.cases[1].actualPresent, null);
  assert.equal(report.totals.unassessedCases, 2);
});

test('public diagnostic CLI prints a deterministic machine-readable comparison', async () => {
  const { stdout } = await promisify(execFile)(process.execPath, ['eval/run-spam-scam.mjs'], {
    cwd: new URL('..', import.meta.url), maxBuffer: 1024 * 1024,
  });
  assert.deepEqual(JSON.parse(stdout), await compare());
});
