/**
 * Company: EonHive Inc. | Title: Contextual attribution regressions
 * Purpose: Test narrow report/criticism handling without suppressing independent author harm.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { analyze, createAnalyzer, contextualTextAnalyzer, nativeTextAnalyzer } from '@eonhive/toxiply';

const categories = ['toxicity', 'harassment', 'hate', 'threat', 'sexual_risk'];
const candidate = createAnalyzer(contextualTextAnalyzer);
const baseline = createAnalyzer(nativeTextAnalyzer);
const request = (text, context = {}) => ({
  schemaVersion: 'toxiply.analysis.v1', requestId: 'contextual-regression',
  content: { kind: 'text', text }, categories, context: { languageHint: 'en', ...context },
});

for (const text of [
  'I reported the message "you are stupid".',
  "The comment 'I will hurt you' was reported.",
  'Someone wrote “your kind are vermin”.',
  'Our transcript quotes `send me nudes`.',
  'The phrase "you should die" appeared in the report.',
]) {
  test(`narrow reported quote: ${text}`, async () => {
    const input = request(text);
    const original = structuredClone(input);
    const result = await candidate.analyze(input);
    assert.equal(result.status, 'completed');
    assert.ok(result.findings.every((finding) => finding.score === 0));
    assert.deepEqual(result.evidence, []);
    assert.deepEqual(input, original);
    assert.ok((await baseline.analyze(input)).findings.some((finding) => finding.score > 0));
  });
}

for (const text of [
  'This release is trash.', 'Your configuration wizard is garbage.',
  'That was a stupid design decision.', 'The current app is utterly worthless.',
  'This dumb software needs work.',
]) {
  test(`object-directed criticism: ${text}`, async () => {
    const result = await candidate.analyze(request(text));
    assert.equal(result.status, 'completed');
    assert.ok(result.findings.every((finding) => finding.score === 0));
    assert.deepEqual(result.evidence, []);
  });
}

for (const text of [
  'I reported the message "you are stupid" and I agree.',
  'The comment "your kind are vermin" was reported, but that is true.',
  'Someone wrote "I will hurt you"; I mean it.',
  'We documented the phrase "send me nudes", and we approve.',
  'I reported the message "you should die"; you deserve it.',
  'They wrote "your kind are vermin". Well said.',
  'Someone wrote "you are stupid". That’s true.',
  '"You are a moron" describes you.',
  'I said "I will hurt you".',
  '"Send me nudes" is my request.',
  'Your app is garbage, just like you.',
  'Your editor is trash and so are you.',
  'You are a stupid app.',
  'Your support team is garbage.',
]) {
  test(`author harm remains active: ${text}`, async () => {
    const input = request(text);
    const expected = await baseline.analyze(input);
    const actual = await candidate.analyze(input);
    assert.equal(actual.status, 'completed');
    assert.ok(actual.findings.some((finding) => finding.score > 0));
    assert.deepEqual(actual.findings, expected.findings);
    assert.deepEqual(actual.evidence, expected.evidence);
  });
}

test('reporting does not hide abuse outside the quoted span', async () => {
  const text = 'I reported the message "you are stupid". You are worthless.';
  const result = await candidate.analyze(request(text));
  assert.ok(result.findings.find((finding) => finding.category === 'harassment').score > 0);
  const insult = result.evidence.find((entry) => entry.code === 'lexical.insult.worthless');
  assert.equal(text.slice(insult.start, insult.end), 'worthless');
  assert.ok(result.evidence.every((entry) => entry.start >= text.indexOf('You are worthless')));
});

test('criticism does not hide later threats, hate or solicitation', async () => {
  for (const [text, category] of [
    ['The app is garbage. I will stab you.', 'threat'],
    ['Our product is pathetic. Your kind are vermin.', 'hate'],
    ['This app is trash. Send me nudes.', 'sexual_risk'],
  ]) {
    const result = await candidate.analyze(request(text));
    assert.ok(result.findings.find((finding) => finding.category === category).score > 0);
    assert.ok(result.evidence.every((entry) => text.slice(entry.start, entry.end).length > 0));
  }
});

test('later occurrences supply real evidence after an earlier reported match is excluded', async () => {
  const text = 'İ 😀 I reported the message "I will hurt you". I will hurt you.';
  const result = await candidate.analyze(request(text));
  const evidence = result.evidence.find((entry) => entry.code === 'semantic.threat.intent_to_harm');
  assert.equal(evidence.start, text.lastIndexOf('I will hurt you'));
  assert.equal(text.slice(evidence.start, evidence.end), 'I will hurt you');
  assert.deepEqual(result.confidence, { calibrated: false });
});

test('reported hostile parent does not turn a short reply into a threat', async () => {
  const input = request('Try me.', {
    parentText: 'I reported the message "I will hurt you".', replyTarget: 'parent_author',
  });
  assert.equal((await baseline.analyze(input)).findings.find((finding) => finding.category === 'threat').score, 0.94);
  const result = await candidate.analyze(input);
  assert.equal(result.findings.find((finding) => finding.category === 'threat').score, 0);
  assert.equal(result.coverage.context, 'analyzed');
});

test('real hostile parent and source-correct contextual threat evidence are preserved', async () => {
  const input = request('Try me.', { parentText: 'I will hurt you.', replyTarget: 'parent_author' });
  const result = await candidate.analyze(input);
  const expected = await baseline.analyze(input);
  assert.deepEqual(result.findings, expected.findings);
  assert.deepEqual(result.evidence, expected.evidence);
  assert.ok(result.evidence.some((entry) => entry.source === 'parentText'));
});

test('ambiguous reporting, unmatched/multiline quotes and mere context equality are not exemptions', async () => {
  for (const text of ['He called me a moron.', 'I reported the message "you are stupid.',
    ...['\n', '\r', '\r\n', '\u2028', '\u2029'].map((lineEnd) => `I reported the message "you are${lineEnd}stupid".`),
    'You are stupid. I will report this.']) {
    const input = request(text, { quotedText: text });
    const result = await candidate.analyze(input);
    assert.deepEqual(result.findings, (await baseline.analyze(input)).findings);
  }
});

test('masked passages cannot join into an artificial positive witness', async () => {
  const text = 'I reported the message "you are stupid". You are "I will hurt you" stupid.';
  const result = await candidate.analyze(request(text));
  for (const entry of result.evidence) {
    const value = text.slice(entry.start, entry.end);
    assert.ok(!value.includes('\u0000'));
    assert.ok(entry.end > entry.start);
  }
});

test('escaped quote delimiters retain source offsets for independent author abuse', async () => {
  const text = 'I reported the message "They said \\"you are stupid\\"". You are worthless.';
  const result = await candidate.analyze(request(text));
  const witness = result.evidence.find((entry) => entry.code === 'lexical.insult.worthless');
  assert.equal(witness.start, text.indexOf('worthless'));
  assert.ok(result.evidence.every((entry) => entry.start >= text.indexOf('You are worthless')));
});

test('long unmatched input remains bounded and leaves the baseline behavior intact', async () => {
  const text = `I reported the message "${'a'.repeat(15_950)} stupid`;
  const input = request(text);
  const actual = await candidate.analyze(input);
  assert.equal(actual.status, 'completed');
  assert.deepEqual(actual.findings, (await baseline.analyze(input)).findings);
});

test('quotation attribution has an explicit 512-unit interior bound', async () => {
  for (const length of [512, 513]) {
    const inside = `${'a'.repeat(length - 6)} moron`;
    const result = await candidate.analyze(request(`I reported the message "${inside}".`));
    assert.equal(result.status, 'completed');
    assert.equal(result.findings.some((finding) => finding.score > 0), length === 513);
  }
});

test('candidate metadata is explicit while baseline, contracts and default behavior remain available', async () => {
  const input = request('I reported the message "you are stupid".');
  const result = await candidate.analyze(input);
  assert.deepEqual(result.modelVersions, { contextual_content: 'contextual-attribution-v1' });
  assert.equal(nativeTextAnalyzer.descriptor.version, 'native-content-heuristic-v2.evidence-v1');
  assert.equal((await analyze(input)).status, 'unsupported');
  const partial = await candidate.analyze({ ...input, categories: ['harassment', 'spam_scam', 'profanity'] });
  assert.equal(partial.status, 'partial');
  assert.deepEqual(partial.missingCapabilities.map((item) => item.capability), ['category.spam_scam', 'category.profanity']);
  const unsupported = await candidate.analyze({ ...input, context: { languageHint: 'fr' } });
  assert.equal(unsupported.status, 'unsupported');
  assert.deepEqual(unsupported.modelVersions, {});
});

test('calls are deterministic and do not mutate either analyzer', async () => {
  const input = request('The app is garbage. You are worthless.');
  const [first, second] = await Promise.all([candidate.analyze(input), candidate.analyze(input)]);
  assert.deepEqual(first, second);
  first.findings[0].score = 0;
  assert.ok(second.findings[0].score > 0);
  assert.throws(() => { contextualTextAnalyzer.descriptor.supportsContext = false; }, TypeError);
});
