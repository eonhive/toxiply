/**
 * Company: EonHive Inc. | Title: Analysis execution tests
 * Purpose: Verify capability planning, bounded context, and evidence provenance.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createAnalyzer, LIMITS } from '@eonhive/toxiply';
import { descriptor, fixtureAnalyzer, output, request } from './helpers.mjs';

test('unavailable categories are omitted and explicitly marked missing', async () => {
  let received;
  const engine = createAnalyzer(fixtureAnalyzer({ analyze(input) { received = input; return output; } }));
  const result = await engine.analyze({ ...request, categories: ['hate', 'harassment'] });
  assert.equal(result.status, 'partial');
  assert.deepEqual(received.categories, ['harassment']);
  assert.deepEqual(result.coverage.categories, ['harassment']);
  assert.deepEqual(result.missingCapabilities, [{ capability: 'category.hate', reason: 'not_supported' }]);
});

test('no supported category skips the analyzer without fabricating scores or versions', async () => {
  const engine = createAnalyzer(fixtureAnalyzer({ analyze() { assert.fail('must not run'); } }));
  const result = await engine.analyze({ ...request, categories: ['hate'] });
  assert.equal(result.status, 'unsupported');
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.modelVersions, {});
  assert.deepEqual(result.coverage.categories, []);
});

test('unknown and unsupported languages are explicit and skip execution', async () => {
  const engine = createAnalyzer(fixtureAnalyzer({ analyze() { assert.fail('must not run'); } }));
  for (const [context, capability] of [[{}, 'language.und'], [{ languageHint: 'fr' }, 'language.fr'], [{ languageHint: 'en-us' }, 'language.en.us']]) {
    const result = await engine.analyze({ ...request, context });
    assert.equal(result.status, 'unsupported');
    assert.deepEqual(result.missingCapabilities, [{ capability, reason: 'not_supported' }]);
    assert.equal(result.coverage.language, null);
  }
});

test('an analyzer can explicitly accept unknown language without claiming detection', async () => {
  const engine = createAnalyzer(fixtureAnalyzer({ descriptor: { ...descriptor, languages: ['und'] } }));
  const result = await engine.analyze({ ...request, context: {} });
  assert.equal(result.status, 'completed');
  assert.equal(result.coverage.language, 'und');
});

test('unsupported semantic context is removed and reported as partial', async () => {
  let received;
  const engine = createAnalyzer(fixtureAnalyzer({ analyze(input) { received = input; return output; } }));
  const result = await engine.analyze({
    ...request, context: { languageHint: 'en', parentText: 'Synthetic parent.', quotedText: 'Synthetic quote.' },
  });
  assert.deepEqual(received.context, { languageHint: 'en' });
  assert.equal(result.status, 'partial');
  assert.equal(result.coverage.context, 'unsupported');
  assert.deepEqual(result.missingCapabilities, [{ capability: 'semantic_context', reason: 'not_supported' }]);
});

test('supported context is passed unchanged and can provide attributed evidence', async () => {
  const input = { ...request, context: { languageHint: 'en', parentText: 'Synthetic parent.', quotedText: 'Synthetic quote.' } };
  const engine = createAnalyzer(fixtureAnalyzer({
    descriptor: { ...descriptor, supportsContext: true },
    analyze(received) {
      assert.deepEqual(received, input);
      return { ...output, evidence: [{ ...output.evidence[0], source: 'quotedText' }] };
    },
  }));
  const result = await engine.analyze(input);
  assert.equal(result.status, 'completed');
  assert.equal(result.coverage.context, 'analyzed');
  assert.equal(result.evidence[0].source, 'quotedText');
});

test('zero is an assessed signal with provenance, not an unavailable category', async () => {
  const engine = createAnalyzer(fixtureAnalyzer({ analyze: async () => ({
    findings: [{ category: 'harassment', score: 0, evidenceIds: [] }], evidence: [],
  }) }));
  const result = await engine.analyze(request);
  assert.equal(result.status, 'completed');
  assert.equal(result.findings[0].score, 0);
  assert.deepEqual(result.modelVersions, { 'fixture-only': 'fixture-v1' });
});

test('Unicode limits count code points while evidence spans use UTF-16 offsets', async () => {
  const engine = createAnalyzer(fixtureAnalyzer({ analyze: () => ({
    ...output, evidence: [{ ...output.evidence[0], start: 0, end: LIMITS.text * 2 }],
  }) }));
  const result = await engine.analyze({ ...request, content: { kind: 'text', text: '😀'.repeat(LIMITS.text) } });
  assert.equal(result.status, 'completed');
  const tooLong = await engine.analyze({ ...request, content: { kind: 'text', text: '😀'.repeat(LIMITS.text + 1) } });
  assert.equal(tooLong.error.code, 'invalid_request');
});

test('maximum context is accepted without truncation or normalization', async () => {
  const input = { ...request, context: { languageHint: 'en', parentText: '😀'.repeat(4_000), quotedText: ' q'.repeat(1_000) } };
  const engine = createAnalyzer(fixtureAnalyzer({
    descriptor: { ...descriptor, supportsContext: true },
    analyze(received) { assert.deepEqual(received, input); return output; },
  }));
  assert.equal((await engine.analyze(input)).status, 'completed');
});

test('concurrent calls do not share mutable state and adapters cannot alter caller input', async () => {
  const original = structuredClone(request);
  const engine = createAnalyzer(fixtureAnalyzer({ async analyze(input) {
    input.requestId = 'mutated';
    input.content.text = 'changed';
    input.categories.push('hate');
    await Promise.resolve();
    return output;
  } }));
  const [first, second] = await Promise.all([engine.analyze(original), engine.analyze(original)]);
  assert.deepEqual(original, request);
  assert.equal(first.status, 'completed');
  assert.equal(first.requestId, 'fixture-1');
  first.findings[0].score = 0;
  assert.equal(second.findings[0].score, 0.75);
});
