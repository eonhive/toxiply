/**
 * Company: EonHive Inc. | Title: Extracted native analyzer regression tests
 * Purpose: Verify opt-in behavior, coverage, context, evidence and deterministic scores.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyze, analysisRequestSchema, analysisResultSchema, createAnalyzer, nativeTextAnalyzer,
} from '@eonhive/toxiply';
import { analyzeNativeContent } from '../dist/native/analyze-native-content.js';
import { fixtureAnalyzer } from './helpers.mjs';

const categories = ['toxicity', 'harassment', 'hate', 'threat', 'sexual_risk'];
const engine = createAnalyzer(nativeTextAnalyzer);
const request = (text, changes = {}) => ({
  schemaVersion: 'toxiply.analysis.v1', requestId: 'native-regression',
  content: { kind: 'text', text }, categories, context: { languageHint: 'en' }, ...changes,
});

test('native extraction is opt-in and leaves the default unconfigured', async () => {
  const result = await analyze(request('I will hurt you.'));
  assert.equal(result.status, 'unsupported');
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.modelVersions, {});
});

test('native threat scores and lane provenance preserve the deterministic assessment', async () => {
  const result = await engine.analyze(request('I will hurt you.'));
  assert.equal(result.status, 'completed');
  assert.deepEqual(Object.fromEntries(result.findings.map((f) => [f.category, f.score])), {
    toxicity: 0.82, harassment: 0.78, hate: 0, threat: 0.98, sexual_risk: 0,
  });
  assert.deepEqual(result.modelVersions, { native_content: 'native-content-heuristic-v2.evidence-v1' });
  assert.equal(result.confidence.calibrated, false);
  assert.equal(analysisResultSchema.safeParse(result).success, true);
  const internal = analyzeNativeContent({ text: 'I will hurt you.' });
  assert.equal(internal.subtype, 'explicit_threat');
  assert.equal(internal.severity, 'critical');
  assert.deepEqual(internal.modelVersions, {
    lexical: 'lexical-heuristic-v2', semantic: 'semantic-heuristic-v2',
    conversation: 'conversation-heuristic-v2', aggregator: 'toxiply-aggregator-v2',
  });
});

test('benign zero scores follow an executed assessment with no fabricated evidence', async () => {
  const result = await engine.analyze(request('Thanks for reading.'));
  assert.equal(result.status, 'completed');
  assert.equal(result.findings.length, 5);
  assert.ok(result.findings.every((f) => f.score === 0 && f.evidenceIds.length === 0));
  assert.deepEqual(result.evidence, []);
  assert.deepEqual(result.coverage.categories, categories);
  assert.equal(result.coverage.input, 'text');
  assert.equal(result.coverage.context, 'not_requested');
});

test('contextual threats and reply-target hints preserve the legacy content behavior', async () => {
  const result = await engine.analyze(request('Try me.', {
    context: { languageHint: 'en', parentText: 'I will hurt you.', replyTarget: 'parent_author' },
  }));
  assert.equal(result.status, 'completed');
  assert.equal(result.coverage.context, 'analyzed');
  assert.equal(result.findings.find((f) => f.category === 'threat').score, 0.94);
  const internal = analyzeNativeContent({
    text: 'Try me.', parentText: 'I will hurt you.', replyTarget: 'parent_author',
  });
  assert.equal(internal.targeting.targetType, 'parent_author');
  assert.equal(internal.scores.escalation, 0.86);
});

test('extraction retains known criticism false positives instead of tuning the classifier', async () => {
  const result = await engine.analyze(request('Your editor is garbage.'));
  assert.equal(result.findings.find((f) => f.category === 'harassment').score, 0.62);
  assert.equal(result.findings.find((f) => f.category === 'toxicity').score, 0.58);
});

test('evidence identifies matched rules without attributing unrelated quoted fields', async () => {
  const input = request('😀 You are a moron.', {
    context: { languageHint: 'en', quotedText: 'A quoted remark 😀' },
  });
  const original = structuredClone(input);
  const result = await engine.analyze(input);
  assert.equal(result.status, 'completed');
  assert.deepEqual(input, original);
  assert.deepEqual(result.evidence.map(({ source, start, end }) => ({ source, start, end })), [
    { source: 'text', start: 3, end: 6 },
    { source: 'text', start: 13, end: 18 },
  ]);
  assert.deepEqual(result.evidence.map((e) => input.content.text.slice(e.start, e.end)), ['You', 'moron']);
  assert.ok(result.evidence.every((e) => e.code.startsWith('lexical.')));
  for (const finding of result.findings.filter((f) => f.score > 0)) {
    assert.ok(finding.evidenceIds.includes(result.evidence[1].id));
  }
});

for (const [text, category, score] of [
  ['You are stupid.', 'harassment', 0.66],
  ['Those people are vermin.', 'hate', 0.91],
  ['Send me nudes.', 'sexual_risk', 0.86],
]) {
  test(`frozen native scoring: ${category}`, async () => {
    const result = await engine.analyze(request(text, { categories: [category] }));
    assert.equal(result.status, 'completed');
    assert.equal(result.findings[0].score, score);
    assert.ok(result.findings[0].evidenceIds.length > 0);
  });
}

test('unimplemented profanity and spam categories remain unavailable', async () => {
  const partial = await engine.analyze(request('A short note.', {
    categories: ['harassment', 'profanity', 'spam_scam'],
  }));
  assert.equal(partial.status, 'partial');
  assert.deepEqual(partial.findings.map((f) => f.category), ['harassment']);
  assert.deepEqual(partial.missingCapabilities.map((m) => m.capability), [
    'category.profanity', 'category.spam_scam',
  ]);
  const unsupported = await engine.analyze(request('A short note.', { categories: ['profanity'] }));
  assert.equal(unsupported.status, 'unsupported');
  assert.deepEqual(unsupported.findings, []);
  assert.deepEqual(unsupported.modelVersions, {});
});

test('language coverage distinguishes an unknown hint from unsupported languages', async () => {
  const unknown = await engine.analyze(request('A short note.', { context: {} }));
  assert.equal(unknown.status, 'completed');
  assert.equal(unknown.coverage.language, 'und');
  for (const languageHint of ['es', 'en-us']) {
    const result = await engine.analyze(request('A short note.', { context: { languageHint } }));
    assert.equal(result.status, 'unsupported');
    assert.deepEqual(result.findings, []);
    assert.deepEqual(result.modelVersions, {});
  }
});

test('reply-target context is controlled, optional and stripped from unsupported analyzers', async () => {
  let received;
  const fixture = fixtureAnalyzer({ analyze(input) {
    received = input;
    return { findings: [{ category: 'harassment', score: 0, evidenceIds: [] }], evidence: [] };
  } });
  const input = request('A short note.', {
    categories: ['harassment'], context: { languageHint: 'en', replyTarget: 'self' },
  });
  assert.equal(analysisRequestSchema.safeParse(input).success, true);
  const result = await createAnalyzer(fixture).analyze(input);
  assert.equal(result.status, 'partial');
  assert.equal(result.coverage.context, 'unsupported');
  assert.equal(received.context.replyTarget, undefined);
  const bad = await engine.analyze({ ...input, context: { replyTarget: 'tenant_admin' } });
  assert.equal(bad.status, 'failed');
  assert.equal(bad.error.code, 'invalid_request');
});

test('native results are deterministic, detached and request-local', async () => {
  const first = await engine.analyze(request('You are a moron.'));
  const second = await engine.analyze(request('You are a moron.'));
  assert.deepEqual(first, second);
  first.findings[0].score = 0;
  const concurrent = await Promise.all([
    engine.analyze(request('You are a moron.')),
    engine.analyze(request('Thanks for reading.')),
  ]);
  assert.deepEqual(concurrent[0], second);
  assert.ok(concurrent[1].findings.every((f) => f.score === 0));
});
