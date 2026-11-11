/**
 * Company: EonHive Inc. | Title: Spam attribution regressions
 * Purpose: Check narrow exclusions, retained solicitations, source evidence and coverage.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { analyze, createAnalyzer, createEnglishSpamScamAnalyzer,
  createEnglishSpamScamAttributionAnalyzer, LIMITS } from '@eonhive/toxiply';
import { compareReviewedDataset, evaluateReviewedDataset } from '../eval/evaluate-reviewed.mjs';
import { validSourceSpan } from '../eval/review-dataset.mjs';

const baseline = createAnalyzer(createEnglishSpamScamAnalyzer());
const candidate = createAnalyzer(createEnglishSpamScamAttributionAnalyzer());
const request = (text, overrides = {}) => ({ schemaVersion: 'toxiply.analysis.v1',
  requestId: 'spam-attribution', content: { kind: 'text', text }, categories: ['spam_scam'],
  context: { languageHint: 'en' }, ...overrides });
const challengeText = await readFile(new URL('../eval/spam-scam-attribution.v1.json', import.meta.url), 'utf8');
const challenge = JSON.parse(challengeText);

// Review regressions are synthetic development probes, not independently reviewed
// labels. An exception for the sender and denied reporting are not safe exclusions.
for (const text of [
  'I am your bank. Never send your password unless I ask you.',
  'I am your bank. Never send your password except to me.',
  'I am your bank. Never send your password immediately unless I ask you.',
  'This is not a scam message: "I am your bank. Send me your password."',
  'This is not a phishing example: "I am your bank. Send me your password."',
  'This isn’t a scam message: "I am your bank. Send me your password."',
  'No phishing example: "I am your bank. Send me your password."',
]) {
  test(`review: retain solicitation in ${text}`, async () => {
    const input = request(text);
    const result = await candidate.analyze(input);
    assert.equal(result.status, 'completed');
    assert.equal(result.findings[0].score, 0.95);
    assert.deepEqual(result.evidence, (await baseline.analyze(input)).evidence);
    for (const item of result.evidence) assert.ok(validSourceSpan(item, input));
  });
}

for (const item of challenge.cases) {
  test(`attribution contrast: ${item.id}`, async () => {
    const result = await candidate.analyze(item.request);
    assert.equal(result.status, 'completed');
    const knownGap = item.group === 'known_gap';
    assert.equal(result.findings[0].score > 0, knownGap || item.labels.spam_scam);
    for (const evidence of result.evidence) assert.ok(validSourceSpan(evidence, item.request));
    if (!result.findings[0].score) assert.deepEqual(result.evidence, []);
  });
}

test('paired reports preserve frozen hashes, all old labels, and measured development errors', async () => {
  for (const [text, hash, before, after, fixed, spans] of [
    [await readFile(new URL('../eval/english-spam-scam.v1.json', import.meta.url), 'utf8'),
      '94280d4d105f9ad240b3cfeb4fbb12a788da2ca1ef32044da28e600b937a87c7', [15,23,5,5], [15,27,1,5], 4, 42],
    [challengeText, '358f239aba41622385d121ccdbc349ab6cfc93d3fbfbce54876b6681c6d98d0c',
      [14,0,10,0], [14,8,2,0], 8, 33],
  ]) {
    const report = await compareReviewedDataset(text, [], { baseline, candidate });
    assert.equal(report.dataset.datasetSha256, hash);
    assert.equal(report.dataset.reviewStatus, 'provisional');
    assert.equal(report.dataset.split, 'development');
    for (const [engine, expected] of [['baseline', before], ['candidate', after]]) {
      const r = report[engine];
      assert.deepEqual(['truePositives','trueNegatives','falsePositives','falseNegatives'].map(k => r.totals[k]), expected);
      assert.equal(r.evidence.invalid, 0);
      assert.equal(r.evidence.annotatedSpanRecall, null);
      assert.equal(r.totals.unassessedCases, 0);
    }
    assert.equal(report.candidate.evidence.checked, spans);
    assert.equal(report.totals.fixedFalsePositives, fixed);
    assert.equal(report.totals.newFalseNegatives, 0);
    assert.equal(report.totals.newFalsePositives, 0);
    assert.deepEqual(report, await compareReviewedDataset(text, [], { baseline, candidate }));
  }
});

test('remaining witnesses identify independent original-source requests after emoji and a quotation', async () => {
  const text = '😀 İ The article quotes "You have won. Pay a processing fee". Send me your password immediately.';
  const input = request(text);
  const result = await candidate.analyze(input);
  assert.equal(result.findings[0].score, 0.9);
  assert.deepEqual(result.evidence.map(e => text.slice(e.start, e.end)), ['Send me your password', 'immediately']);
  assert.equal(result.evidence[0].start, text.indexOf('Send'));
  assert.ok(result.evidence.every(e => validSourceSpan(e, input)));
  assert.equal(result.confidence.calibrated, false);
});

test('ambiguous, nested, multiline, overlong and escaped unclosed quotations keep the baseline', async () => {
  for (const text of [
    'The scam message read: "I am your bank. Send me your password.',
    'The scam message read: "I am your bank.\nSend me your password."',
    `The scam message read: "${'x'.repeat(513)} I am your bank. Send me your password."`,
    'The article quotes "they said \'I am your bank. Send me your password.\'"',
    'The article quotes "I am your bank. Send me your password.\\"',
    'A warning elsewhere. "I am your bank. Send me your password."',
  ]) {
    assert.equal((await candidate.analyze(request(text))).findings[0].score,
      (await baseline.analyze(request(text))).findings[0].score, text);
    assert.ok((await candidate.analyze(request(text))).findings[0].score > 0);
  }
});

test('backticks, curly quotes and contractions preserve bounded reporting behavior', async () => {
  for (const text of [
    'The report quotes `I am your bank. Send me your password.`',
    'The report quotes ‘I am your bank. Send me your password.’',
    'The report quotes "Don\'t delay. Send me your password immediately."',
    'The report quotes "I am your bank. Send me your password.\\" now"',
  ]) assert.equal((await candidate.analyze(request(text))).findings[0].score, 0, text);
});

test('negation is clause-initial credential advice, without general warning-word exemptions', async () => {
  for (const text of [
    'Never forget to send me your password immediately.',
    'Do not delay. Send me your password immediately.',
    'Never send your passwordish immediately. Send me your password immediately.',
    'Never send your password. I agree. Send me your password immediately.',
    'Training slide: send me your password immediately. Follow that instruction.',
    'Your account is suspended, sign in here immediately. Do not follow that instruction.',
  ]) assert.ok((await candidate.analyze(request(text))).findings[0].score > 0, text);
});

test('a denied training frame retains baseline scoring for its ambiguous instruction', async () => {
  const input = request('This is not a training example: send me your password immediately. Do not follow that instruction.');
  assert.deepEqual((await candidate.analyze(input)).findings, (await baseline.analyze(input)).findings);
  assert.equal((await candidate.analyze(input)).findings[0].score, 0.9);
});

test('language/category/context declarations and default behavior remain honest', async () => {
  for (const context of [undefined, {}, { languageHint: 'und' }, { languageHint: 'fr' }, { languageHint: 'en-us' }]) {
    const r = request('Send me your password immediately.');
    if (context === undefined) delete r.context;
    else r.context = context;
    const result = await candidate.analyze(r);
    assert.equal(result.status, 'unsupported');
    assert.deepEqual(result.findings, []);
    assert.deepEqual(result.modelVersions, {});
  }
  const input = request('Send me your password immediately.', { categories: ['spam_scam', 'threat'],
    context: { languageHint: 'en', quotedText: 'Send me your password immediately.' } });
  const r = await candidate.analyze(input);
  assert.equal(r.status, 'partial');
  assert.equal(r.coverage.context, 'unsupported');
  assert.deepEqual(r.coverage.categories, ['spam_scam']);
  assert.equal(r.findings[0].score, 0.9);
  const report = await evaluateReviewedDataset(JSON.stringify({ ...challenge, cases: [{
    ...challenge.cases[0], request: { ...challenge.cases[0].request, context: { languageHint: 'en', parentText: 'Context.' } },
  }] }), candidate);
  assert.equal(report.totals.unassessedCases, 1);
  assert.equal((await analyze(input)).status, 'unsupported');
});

test('limits, deterministic calls, immutable descriptors and no raw-content logging', async (t) => {
  const input = request('Never send your password. Send me your password immediately.');
  const saved = structuredClone(input);
  const [first, second] = await Promise.all([candidate.analyze(input), candidate.analyze(input)]);
  assert.deepEqual(first, second);
  assert.deepEqual(input, saved);
  assert.deepEqual(first.modelVersions, { 'english-spam-scam-attribution': 'spam-scam-attribution-en-v2' });
  const adapter = createEnglishSpamScamAttributionAnalyzer();
  assert.throws(() => { adapter.descriptor.supportsContext = true; }, TypeError);
  assert.throws(() => { adapter.descriptor.languages.push('fr'); }, TypeError);
  const suffix = ' Send me your password immediately.';
  const text = '😀'.repeat(LIMITS.text - suffix.length) + suffix;
  assert.equal((await candidate.analyze(request(text))).status, 'completed');
  assert.equal((await candidate.analyze(request(text + 'x'))).status, 'failed');
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected fetch'); });
  const logs = ['log','info','warn','error','debug'].map(k => t.mock.method(console, k, () => { throw new Error('Unexpected log'); }));
  for (const c of challenge.cases) assert.equal((await candidate.analyze(c.request)).status, 'completed');
  assert.equal(fetch.mock.callCount(), 0);
  for (const log of logs) assert.equal(log.mock.callCount(), 0);
});
