/**
 * Company: EonHive Inc. | Title: Native category and contextual evidence regressions
 * Purpose: Verify actual rule witnesses, Unicode offsets and bounded context.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createAnalyzer, nativeTextAnalyzer, LIMITS } from '@eonhive/toxiply';
import { analyzeNativeContent } from '../dist/native/analyze-native-content.js';

const categories = ['toxicity', 'harassment', 'hate', 'threat', 'sexual_risk'];
const engine = createAnalyzer(nativeTextAnalyzer);
const request = (text, context = {}) => ({
  schemaVersion: 'toxiply.analysis.v1', requestId: 'native-evidence',
  content: { kind: 'text', text }, categories, context: { languageHint: 'en', ...context },
});

for (const [text, category, witness] of [
  ['  😀 You are stupid.  ', 'harassment', 'You are stupid'],
  ['Your kind are vermin.', 'hate', 'vermin'],
  ['I will shoot you.', 'threat', 'I will shoot you'],
  ['Please send me nudes.', 'sexual_risk', 'send me nudes'],
  ['Shut up.', 'toxicity', 'Shut up'],
]) {
  test(`category-specific evidence: ${category}`, async () => {
    const result = await engine.analyze(request(text));
    assert.equal(result.status, 'completed');
    const finding = result.findings.find((entry) => entry.category === category);
    assert.ok(finding.score > 0);
    const evidence = result.evidence.filter((entry) => finding.evidenceIds.includes(entry.id));
    assert.ok(evidence.some((entry) => text.slice(entry.start, entry.end) === witness));
    assert.ok(evidence.every((entry) => entry.source === 'text'));
    assert.ok(result.evidence.every((entry) => text.slice(entry.start, entry.end).trim().length > 0));
  });
}

test('Unicode lowercasing expansion and leading whitespace never shift source offsets', async () => {
  const text = ' \tİ 😀 YOU ARE STUPID.  ';
  const result = await engine.analyze(request(text));
  const evidence = result.evidence.find((entry) => entry.code === 'semantic.insult.direct_name_calling');
  assert.equal(result.status, 'completed');
  assert.equal(evidence.start, text.indexOf('YOU'));
  assert.equal(text.slice(evidence.start, evidence.end), 'YOU ARE STUPID');
});

test('a normalized match still points to its actual Unicode source spelling', async () => {
  const text = 'kiKe';
  const result = await engine.analyze(request(text));
  const evidence = result.evidence.find((entry) => entry.code === 'lexical.hate.antisemitic_slur');
  assert.equal(result.status, 'completed');
  assert.equal(text.slice(evidence.start, evidence.end), text);
});

test('contextual threat evidence references current warning and matched hostile parent', async () => {
  const input = request('  Try me. ', { parentText: '😀 I will hurt you. ', replyTarget: 'parent_author' });
  const result = await engine.analyze(input);
  const threat = result.findings.find((entry) => entry.category === 'threat');
  assert.equal(result.status, 'completed');
  assert.equal(threat.score, 0.94);
  assert.equal(result.coverage.context, 'analyzed');
  const spans = result.evidence.filter((entry) => threat.evidenceIds.includes(entry.id));
  assert.deepEqual(spans.map((entry) => ({ source: entry.source, text: (entry.source === 'text'
    ? input.content.text : input.context[entry.source]).slice(entry.start, entry.end) })), [
    { source: 'text', text: 'Try me' }, { source: 'parentText', text: 'hurt' },
  ]);
});

test('quoted and parent harm are preserved as context without becoming author evidence', async () => {
  const input = request('How do I submit a report?', {
    parentText: 'You are a moron.', quotedText: 'I will shoot you.', replyTarget: 'parent_author',
  });
  const result = await engine.analyze(input);
  assert.equal(result.coverage.context, 'analyzed');
  assert.ok(result.findings.every((entry) => entry.score === 0));
  assert.deepEqual(result.evidence, []);
  const withoutQuote = analyzeNativeContent({ text: 'Hello there.' });
  const withQuote = analyzeNativeContent({ text: 'Hello there.', quotedText: 'I will hurt you.' });
  assert.ok(withQuote.scores.escalation > withoutQuote.scores.escalation);
  assert.ok(withQuote.rationale.signals.includes('conversation:quoted_context_present'));
});

test('quoted reporting in the current text retains the known legacy false positive', async () => {
  const text = 'I reported the message "you are stupid".';
  const result = await engine.analyze(request(text));
  assert.ok(result.findings.find((entry) => entry.category === 'harassment').score > 0);
  assert.ok(result.evidence.some((entry) => text.slice(entry.start, entry.end) === 'you are stupid'));
});

test('self and group hints are retained without fabricating a text span for an enum', async () => {
  for (const replyTarget of ['self', 'group', 'parent_author', 'unknown']) {
    const input = { text: 'You are stupid.', replyTarget };
    const signals = analyzeNativeContent(input);
    assert.equal(signals.targeting.targetType, replyTarget);
    const result = await engine.analyze(request(input.text, { replyTarget }));
    assert.equal(result.status, 'completed');
    assert.equal(result.coverage.context, 'analyzed');
    assert.ok(result.evidence.every((entry) => entry.source === 'text'));
  }
});

test('high rule counts remain below evidence limits and every item is referenced', async () => {
  const text = `You are an idiot moron loser stupid dumb clown pathetic trash garbage scum worthless.
I will hurt you; you should die; you are dead; watch your back; one more word; say that again.
Your kind are subhuman vermin filth animals. Go back to your country.
Send me nudes and explicit pics. Show me your body. Let me see you naked.
Shut up; nobody wants you here; try me; "idiot" fits; nice genius; what a hero.`;
  const result = await engine.analyze(request(text, { parentText: 'I will shoot you.' }));
  assert.equal(result.status, 'completed');
  assert.ok(result.evidence.length <= LIMITS.evidence);
  assert.ok(result.evidence.every((entry) => result.findings.some((finding) => finding.evidenceIds.includes(entry.id))));
});

test('maximum bounded context is accepted and oversized context never executes', async () => {
  const hostile = ' I will hurt you';
  const result = await engine.analyze(request('Try me.', {
    parentText: `${'a'.repeat(4_000 - hostile.length)}${hostile}`, quotedText: 'q'.repeat(2_000), replyTarget: 'parent_author',
  }));
  assert.equal(result.status, 'completed');
  const invalid = await engine.analyze(request('Try me.', { parentText: 'a'.repeat(4_001) }));
  assert.equal(invalid.error.code, 'invalid_request');
  assert.deepEqual(invalid.modelVersions, {});
});
