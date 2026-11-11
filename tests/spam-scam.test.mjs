/**
 * Company: EonHive Inc. | Title: Spam/scam analyzer regressions
 * Purpose: Check cue combinations, honest coverage, source boundaries and local execution.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns';
import test from 'node:test';
import { analyze, createAnalyzer, createEnglishSpamScamAnalyzer,
  createEnglishProfanityAnalyzer, nativeTextAnalyzer, contextualTextAnalyzer,
  LIMITS, SCHEMA_VERSION } from '@eonhive/toxiply';
import { validSourceSpan } from '../eval/review-dataset.mjs';

const engine = createAnalyzer(createEnglishSpamScamAnalyzer());
const request = (text, overrides = {}) => ({ schemaVersion: SCHEMA_VERSION,
  requestId: 'spam-test', content: { kind: 'text', text }, categories: ['spam_scam'],
  context: { languageHint: 'en' }, ...overrides });

for (const [text, rule, spans] of [
  ['Your account is suspended. Sign in here immediately.', 'phishing_login', ['Your account is suspended', 'Sign in here', 'immediately']],
  ['You have won! Pay a processing fee.', 'prize_fee', ['You have won', 'Pay a processing fee']],
  ['You have won! Send me your password.', 'prize_credentials', ['You have won', 'Send me your password']],
  ['Act now: send 200 bitcoin.', 'payment_pressure', ['Act now', 'send 200', 'bitcoin']],
  ['I am your CEO. Send us gift cards.', 'payment_impersonation', ['I am your CEO', 'Send us gift cards', 'gift cards']],
  ['This is your bank. Send me your password.', 'credential_impersonation', ['This is your bank', 'Send me your password']],
  ['Reply with your verification code immediately.', 'credential_pressure', ['Reply with your verification code', 'immediately']],
  ['Guaranteed returns: invest 500.', 'financial_solicitation', ['Guaranteed returns', 'invest 500']],
  ['Unsolicited exclusive deal. Buy now.', 'unsolicited_promotion', ['Unsolicited', 'exclusive deal', 'Buy now']],
  ['Exclusive deal! EXCLUSIVE DEAL! Exclusive\tdeal! Order now.', 'repeated_promotion', ['Exclusive deal', 'EXCLUSIVE DEAL', 'Exclusive\tdeal', 'Order now']],
]) {
  test(`source-grounded ${rule}`, async () => {
    const input = request(text);
    const result = await engine.analyze(input);
    assert.equal(result.status, 'completed');
    assert.equal(result.findings[0].category, 'spam_scam');
    assert.ok(result.findings[0].score > 0 && result.findings[0].score <= 1);
    assert.deepEqual(result.findings[0].evidenceIds, result.evidence.map((item) => item.id));
    assert.deepEqual(result.evidence.map((item) => text.slice(item.start, item.end)).sort(), [...spans].sort());
    for (const item of result.evidence) {
      assert.ok(validSourceSpan(item, input));
      assert.ok(item.code.startsWith(`spam_scam.${rule}.`));
    }
    assert.deepEqual(result.confidence, { calibrated: false });
  });
}

test('single cues, ordinary promotions, support, payments, warnings, links and urgency remain zero', async () => {
  for (const text of [
    'New product launch: 20% off. Order now.', 'Your invoice for $200 is ready.',
    'Act now!', 'I am your bank.', 'Please visit https://example.invalid/login.',
    'Customer support will help you reset your password in the app.',
    'Urgent: pay 200 for the venue by bank transfer.',
    'Phishing is dangerous. Never disclose private credentials.',
    'The article mentions a fake prize.', 'Urgent: the cake is ready!',
    'Exclusive deal! Exclusive deal! Order now.',
    'Exclusive deal! Exclusive deal! Exclusive deal!',
    'Exclusive deal! Special discount! Limited time offer! Order now.',
    'Please pay with bitcoin at our store.',
  ]) {
    const result = await engine.analyze(request(text));
    assert.equal(result.status, 'completed');
    assert.deepEqual(result.findings, [{ category: 'spam_scam', score: 0, evidenceIds: [] }], text);
    assert.deepEqual(result.evidence, []);
  }
});

test('removing each independent cue disables a three-cue phishing rule', async () => {
  for (const text of ['Sign in here immediately.', 'Your account is suspended immediately.',
    'Your account is suspended. Sign in here.']) {
    assert.equal((await engine.analyze(request(text))).findings[0].score, 0);
  }
});

test('240-unit window includes its end and does not join distant cues', async () => {
  const first = 'I am your bank';
  const last = 'Send me your password';
  const text = first + ' '.repeat(240 - first.length - last.length) + last;
  assert.equal((await engine.analyze(request(text))).findings[0].score, 0.95);
  assert.equal((await engine.analyze(request(`${first} ${text.slice(first.length)}`))).findings[0].score, 0);
  assert.equal((await engine.analyze(request(`Act now.${'x'.repeat(300)} Send 200 bitcoin`))).findings[0].score, 0);
});

test('late complete combinations work after earlier isolated cues', async () => {
  const text = `I am your bank.${'x'.repeat(300)} This is your bank. Send us your password.`;
  const result = await engine.analyze(request(text));
  assert.equal(result.findings[0].score, 0.95);
  assert.ok(result.evidence.every((item) => item.start > 300));
});

test('Unicode prefixes preserve original UTF-16 indices and token boundaries', async () => {
  const text = '😀İ e\u0301 🛰️ This is your bank. Send me your password.';
  const result = await engine.analyze(request(text));
  assert.equal(result.status, 'completed');
  assert.equal(result.evidence[0].start, text.indexOf('This'));
  for (const item of result.evidence) assert.ok(validSourceSpan(item, request(text)));
  for (const decorated of ['éurgent', '_urgent', 'urgent123', 'urgent\u0301', 'urgent中']) {
    assert.equal((await engine.analyze(request(`${decorated} send 200 bitcoin`))).findings[0].score, 0);
  }
});

test('quotes, negation and satire remain explicit surface-rule false-positive limitations', async () => {
  for (const text of [
    'The report quotes "I am your bank. Send me your password."',
    'Never send your password immediately.',
    'Satire: I am your CEO. Send us gift cards for an imaginary yacht.',
  ]) {
    const result = await engine.analyze(request(text));
    assert.ok(result.findings[0].score > 0);
    for (const item of result.evidence) assert.ok(validSourceSpan(item, request(text)));
  }
});

test('semantic context is unassessed and cannot change current-text findings', async () => {
  for (const context of [
    { parentText: 'I am your bank. Send me your password.' },
    { quotedText: 'Reply with your verification code immediately.' },
    { replyTarget: 'parent_author' },
  ]) {
    const result = await engine.analyze(request('A normal message.', { context: { languageHint: 'en', ...context } }));
    assert.equal(result.status, 'partial');
    assert.equal(result.coverage.context, 'unsupported');
    assert.equal(result.findings[0].score, 0);
    assert.deepEqual(result.missingCapabilities, [{ capability: 'semantic_context', reason: 'not_supported' }]);
  }
  const result = await engine.analyze(request('I am your bank. Send me your password.', {
    context: { languageHint: 'en', quotedText: 'I am your bank. Send me your password.' },
  }));
  assert.equal(result.status, 'partial');
  assert.equal(result.findings[0].score, 0.95);
  assert.ok(result.evidence.every((item) => item.source === 'text'));
});

test('absent, unknown, regional and non-English hints are unsupported', async () => {
  for (const context of [undefined, {}, { languageHint: 'und' }, { languageHint: 'en-us' }, { languageHint: 'fr' }]) {
    const input = request('I am your bank. Send me your password.');
    if (context === undefined) delete input.context;
    else input.context = context;
    const result = await engine.analyze(input);
    assert.equal(result.status, 'unsupported');
    assert.deepEqual(result.findings, []);
    assert.deepEqual(result.modelVersions, {});
    assert.equal(result.coverage.language, null);
    assert.ok(result.missingCapabilities.some((item) => item.capability === `language.${context?.languageHint?.replaceAll('-', '.') ?? 'und'}`));
  }
});

test('category selection is honest for unsupported and mixed requests', async () => {
  const result = await engine.analyze(request('An ordinary note.', { categories: ['threat', 'spam_scam'] }));
  assert.equal(result.status, 'partial');
  assert.deepEqual(result.coverage.categories, ['spam_scam']);
  assert.deepEqual(result.missingCapabilities, [{ capability: 'category.threat', reason: 'not_supported' }]);
  const unsupported = await engine.analyze(request('An ordinary note.', { categories: ['profanity'] }));
  assert.equal(unsupported.status, 'unsupported');
  assert.deepEqual(unsupported.findings, []);
});

test('text limits include astral code points and reject oversize input without truncation', async () => {
  const ending = ' I am your bank. Send me your password';
  const text = '😀'.repeat(LIMITS.text - Array.from(ending).length) + ending;
  const result = await engine.analyze(request(text));
  assert.equal(result.status, 'completed');
  assert.equal(result.evidence.at(-1).end, text.length);
  assert.equal((await engine.analyze(request(`${text}a`))).error?.code, 'invalid_request');
  for (const text of ['', ' ', 'a'.repeat(LIMITS.text + 1)]) {
    assert.equal((await engine.analyze(request(text))).status, 'failed');
  }
});

test('all rule witnesses remain bounded for dense maximum-size input', async () => {
  const unit = 'I am your bank. Send me your password immediately. You have won. Pay a processing fee. Guaranteed returns. Send 200 bitcoin. Your account is suspended. Sign in here. Unsolicited exclusive deal. Exclusive deal. Exclusive deal. Buy now. ';
  const result = await engine.analyze(request(unit.repeat(Math.floor(LIMITS.text / unit.length))));
  assert.equal(result.status, 'completed');
  assert.equal(result.findings[0].score, 0.95);
  assert.equal(result.evidence.length, 26);
  assert.ok(result.evidence.length <= LIMITS.evidence);
  assert.equal(new Set(result.evidence.map((item) => item.id)).size, result.evidence.length);
});

test('calls are deterministic, detached and leave default and existing analyzers unchanged', async () => {
  const input = request('I am your bank. Send me your password.');
  const saved = structuredClone(input);
  const [first, second] = await Promise.all([engine.analyze(input), engine.analyze(input)]);
  assert.deepEqual(first, second);
  assert.deepEqual(input, saved);
  first.findings[0].score = 0;
  assert.equal(second.findings[0].score, 0.95);
  assert.deepEqual(second.modelVersions, { 'english-spam-scam': 'spam-scam-en-v1' });
  assert.equal((await analyze(input)).status, 'unsupported');
  for (const adapter of [nativeTextAnalyzer, contextualTextAnalyzer, createEnglishProfanityAnalyzer()]) {
    assert.equal((await createAnalyzer(adapter).analyze(input)).status, 'unsupported');
    assert.ok(!adapter.descriptor.categories.includes('spam_scam'));
  }
  const adapter = createEnglishSpamScamAnalyzer();
  assert.throws(() => { adapter.descriptor.supportsContext = true; }, TypeError);
  assert.throws(() => { adapter.descriptor.categories.push('hate'); }, TypeError);
  assert.throws(() => { adapter.descriptor.languages.push('und'); }, TypeError);
});

test('analysis requires no network and emits no raw-input logs', async (t) => {
  const mocks = [];
  for (const [target, methods] of [
    [globalThis, ['fetch']], [http, ['request', 'get']], [https, ['request', 'get']],
    [net, ['connect', 'createConnection']], [tls, ['connect']], [dns, ['lookup', 'resolve']],
    [console, ['log', 'info', 'warn', 'error', 'debug', 'trace']],
  ]) {
    for (const method of methods) mocks.push(t.mock.method(target, method, () => { throw new Error('Unexpected external effect.'); }));
  }
  const dataset = JSON.parse(await readFile(new URL('../eval/english-spam-scam.v1.json', import.meta.url), 'utf8'));
  for (const item of dataset.cases) assert.equal((await engine.analyze(item.request)).status, 'completed');
  const invalid = await engine.analyze(request('secret '.repeat(3000)));
  assert.equal(invalid.status, 'failed');
  assert.ok(!JSON.stringify(invalid).includes('secret '));
  for (const mock of mocks) assert.equal(mock.mock.callCount(), 0);
});
