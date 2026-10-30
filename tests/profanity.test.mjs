/**
 * Company: EonHive Inc. | Title: Native profanity contract tests
 * Purpose: Verify lexical evidence, coverage limits, and deterministic execution.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { analyze, createAnalyzer, createEnglishProfanityAnalyzer, LIMITS } from '@eonhive/toxiply';

const engine = createAnalyzer(createEnglishProfanityAnalyzer());
function request(text, overrides = {}) {
  return {
    schemaVersion: 'toxiply.analysis.v1', requestId: 'profanity-test',
    content: { kind: 'text', text }, categories: ['profanity'],
    context: { languageHint: 'en' }, ...overrides,
  };
}

test('literal signal has exact evidence and algorithm provenance', async () => {
  const result = await engine.analyze(request('😀 Well, SHIT!'));
  assert.equal(result.status, 'completed');
  assert.deepEqual(result.findings, [{ category: 'profanity', score: 1, evidenceIds: ['profanity-1'] }]);
  assert.deepEqual(result.evidence, [{
    id: 'profanity-1', code: 'profanity.literal_token', source: 'text', start: 9, end: 13,
  }]);
  assert.deepEqual(result.modelVersions, { 'english-literal-profanity': 'literal-en-v1' });
  assert.deepEqual(result.coverage, { input: 'text', categories: ['profanity'], context: 'not_requested', language: 'en' });
  assert.deepEqual(result.confidence, { calibrated: false });
  assert.deepEqual(result.missingCapabilities, []);
});

test('all documented terms are recognized case insensitively', async () => {
  const terms = ['fuck', 'fucks', 'fucked', 'fucking', 'shit', 'shits', 'shitty', 'bullshit', 'bitch', 'bitches', 'asshole', 'assholes'];
  for (const term of terms) {
    const text = `A ${term.toUpperCase()} token.`;
    const result = await engine.analyze(request(text));
    assert.equal(result.findings[0].score, 1, term);
    const evidence = result.evidence[0];
    assert.equal(text.slice(evidence.start, evidence.end).toLowerCase(), term);
  }
});

test('one first witness keeps evidence bounded without implying occurrence counts', async () => {
  const result = await engine.analyze(request('shit fuck '.repeat(1_000)));
  assert.equal(result.status, 'completed');
  assert.equal(result.evidence.length, 1);
  assert.equal(result.findings[0].score, 1);
  assert.equal(result.evidence[0].start, 0);
  assert.equal(result.evidence[0].end, 4);
});

test('a match at the end of maximum-sized input is assessed', async () => {
  const text = `${'a'.repeat(LIMITS.text - 5)} shit`;
  const result = await engine.analyze(request(text));
  assert.equal(result.status, 'completed');
  assert.equal(result.evidence[0].start, LIMITS.text - 4);
  assert.equal(result.evidence[0].end, LIMITS.text);
});

for (const text of [
  'The class assignment is finished.', 'scunthorpe', 'bullshitter',
  'shitake', 'shit123', '123shit', '_shit', 'shit_post',
  'éshit', 'shit中', 'shit\u0301', 'fucK',
]) {
  test(`whole-token boundary: ${JSON.stringify(text)}`, async () => {
    const result = await engine.analyze(request(text));
    assert.equal(result.status, 'completed');
    assert.deepEqual(result.findings, [{ category: 'profanity', score: 0, evidenceIds: [] }]);
    assert.deepEqual(result.evidence, []);
  });
}

test('quoted/reporting profanity remains surface evidence without author-intent claims', async () => {
  const text = 'The moderator recorded the word "fuck" in a report.';
  const result = await engine.analyze(request(text));
  assert.equal(result.status, 'completed');
  assert.equal(result.findings[0].score, 1);
  assert.equal(text.slice(result.evidence[0].start, result.evidence[0].end), 'fuck');
  assert.equal(result.findings.length, 1);
});

test('obfuscation and unlisted profanity stay outside lexical coverage', async () => {
  for (const text of ['f*ck', 'sh1t', 'f.u.c.k', 'f u c k', 'fu\u200bck', 'ｆｕｃｋ', 'bastard', 'damn']) {
    const result = await engine.analyze(request(text));
    assert.equal(result.findings[0].score, 0, text);
  }
});

test('other categories remain unsupported or partial without zero-score placeholders', async () => {
  const unsupported = await engine.analyze(request('shit', { categories: ['hate'] }));
  assert.equal(unsupported.status, 'unsupported');
  assert.deepEqual(unsupported.findings, []);
  assert.deepEqual(unsupported.modelVersions, {});
  const partial = await engine.analyze(request('shit', { categories: ['harassment', 'profanity'] }));
  assert.equal(partial.status, 'partial');
  assert.deepEqual(partial.findings.map((finding) => finding.category), ['profanity']);
  assert.deepEqual(partial.missingCapabilities, [{ capability: 'category.harassment', reason: 'not_supported' }]);
});

test('parent and quoted fields do not influence the current-text signal', async () => {
  const result = await engine.analyze(request('An ordinary sentence.', {
    context: { languageHint: 'en', parentText: 'fuck', quotedText: 'shit' },
  }));
  assert.equal(result.status, 'partial');
  assert.equal(result.findings[0].score, 0);
  assert.equal(result.coverage.context, 'unsupported');
  assert.deepEqual(result.missingCapabilities, [{ capability: 'semantic_context', reason: 'not_supported' }]);
});

test('English hints are required and exact; no language detection is claimed', async () => {
  for (const context of [{}, { languageHint: 'fr' }, { languageHint: 'en-us' }]) {
    const result = await engine.analyze(request('shit', { context }));
    assert.equal(result.status, 'unsupported');
    assert.deepEqual(result.modelVersions, {});
    assert.deepEqual(result.findings, []);
    assert.equal(result.coverage.language, null);
    assert.match(result.missingCapabilities[0].capability, /^language\./);
  }
});

test('analyzer descriptors cannot be changed to advertise unimplemented capabilities', () => {
  const analyzer = createEnglishProfanityAnalyzer();
  assert.throws(() => { analyzer.descriptor.supportsContext = true; }, TypeError);
  assert.throws(() => { analyzer.descriptor.categories.push('hate'); }, TypeError);
  assert.throws(() => { analyzer.descriptor.languages.push('fr'); }, TypeError);
});

test('calls are deterministic, detached and do not configure the default entry point', async () => {
  const input = request('SHIT, an example.');
  const original = structuredClone(input);
  const [first, second] = await Promise.all([engine.analyze(input), engine.analyze(input)]);
  assert.deepEqual(first, second);
  assert.deepEqual(input, original);
  first.findings[0].score = 0;
  assert.equal(second.findings[0].score, 1);
  assert.equal((await analyze(input)).status, 'unsupported');
});
