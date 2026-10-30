/**
 * Company: EonHive Inc. | Title: Input and analyzer error tests
 * Purpose: Reject invalid requests and malformed signals without leaking content.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { analyze, analysisResultSchema, createAnalyzer, LIMITS } from '@eonhive/toxiply';
import { descriptor, fixtureAnalyzer, output, request } from './helpers.mjs';

const invalidRequests = [
  ['null', null], ['array', []], ['string', 'raw text'],
  ['missing fields', {}],
  ['wrong schema version', { ...request, schemaVersion: 'toxiply.analysis.v2' }],
  ['unknown root field', { ...request, tenantId: 'tenant-1' }],
  ['unknown content field', { ...request, content: { ...request.content, url: 'https://invalid.example' } }],
  ['unknown context field', { ...request, context: { actorId: 'actor-1' } }],
  ['empty content', { ...request, content: { kind: 'text', text: '' } }],
  ['blank content', { ...request, content: { kind: 'text', text: ' \n\t' } }],
  ['non-string text', { ...request, content: { kind: 'text', text: 42 } }],
  ['oversized text', { ...request, content: { kind: 'text', text: 'a'.repeat(LIMITS.text + 1) } }],
  ['invalid request ID', { ...request, requestId: 'bad id' }],
  ['oversized request ID', { ...request, requestId: 'a'.repeat(129) }],
  ['no categories', { ...request, categories: [] }],
  ['duplicate categories', { ...request, categories: ['hate', 'hate'] }],
  ['unknown category', { ...request, categories: ['made_up'] }],
  ['null context', { ...request, context: null }],
  ['empty context text', { ...request, context: { parentText: '' } }],
  ['oversized context field', { ...request, context: { parentText: 'a'.repeat(LIMITS.contextField + 1) } }],
  ['oversized total context', { ...request, context: { parentText: 'a'.repeat(4_000), quotedText: 'b'.repeat(2_001) } }],
  ['noncanonical language tag', { ...request, context: { languageHint: 'EN_us' } }],
  ...['image', 'audio', 'video'].map((kind) => [`unsupported ${kind} request shape`, { ...request, content: { kind, text: 'not media analysis' } }]),
];

for (const [name, input] of invalidRequests) {
  test(`invalid input: ${name}`, async () => {
    const engine = createAnalyzer(fixtureAnalyzer({ analyze() { assert.fail('invalid input must not execute'); } }));
    const result = await engine.analyze(input);
    assert.equal(result.status, 'failed');
    assert.equal(result.error.code, 'invalid_request');
    assert.deepEqual(result.findings, []);
    assert.deepEqual(result.modelVersions, {});
    assert.equal(analysisResultSchema.safeParse(result).success, true);
  });
}

test('invalid request IDs become null and valid correlation IDs are preserved', async () => {
  assert.equal((await analyze(null)).requestId, null);
  assert.equal((await analyze({ ...request, requestId: 'bad id' })).requestId, null);
  assert.equal((await analyze({ ...request, categories: [] })).requestId, request.requestId);
});

test('validation and execution errors never expose submitted content or exception messages', async () => {
  const secret = 'synthetic-content-that-must-not-be-echoed';
  const failedInput = await analyze({ ...request, content: { kind: 'text', text: secret.repeat(1_000) } });
  assert.doesNotMatch(JSON.stringify(failedInput), new RegExp(secret));
  const engine = createAnalyzer(fixtureAnalyzer({ analyze() { throw new Error(secret); } }));
  const failedExecution = await engine.analyze(request);
  assert.equal(failedExecution.error.code, 'analyzer_failed');
  assert.doesNotMatch(JSON.stringify(failedExecution), new RegExp(secret));
});

for (const [name, badDescriptor] of [
  ['invalid version', { ...descriptor, version: '' }],
  ['empty categories', { ...descriptor, categories: [] }],
  ['duplicate categories', { ...descriptor, categories: ['harassment', 'harassment'] }],
  ['duplicate languages', { ...descriptor, languages: ['en', 'en'] }],
  ['unknown descriptor fields', { ...descriptor, trained: true }],
]) {
  test(`invalid analyzer: ${name}`, async () => {
    const engine = createAnalyzer(fixtureAnalyzer({ descriptor: badDescriptor, analyze() { assert.fail('must not run'); } }));
    const result = await engine.analyze(request);
    assert.equal(result.error.code, 'invalid_analyzer');
    assert.deepEqual(result.modelVersions, {});
  });
}

const invalidOutputs = [
  ['null', () => null],
  ['missing findings', (value) => { value.findings = []; }],
  ['NaN', (value) => { value.findings[0].score = NaN; }],
  ['infinite score', (value) => { value.findings[0].score = Infinity; }],
  ['out-of-range score', (value) => { value.findings[0].score = 1.01; }],
  ['negative score', (value) => { value.findings[0].score = -0.01; }],
  ['unrequested category', (value) => { value.findings[0].category = 'hate'; }],
  ['duplicate category', (value) => { value.findings.push(structuredClone(value.findings[0])); }],
  ['unknown output field', (value) => { value.action = 'hide'; }],
  ['positive score without evidence', (value) => { value.findings[0].evidenceIds = []; value.evidence = []; }],
  ['unknown evidence reference', (value) => { value.findings[0].evidenceIds = ['unknown']; }],
  ['duplicate evidence reference', (value) => { value.findings[0].evidenceIds.push('e1'); }],
  ['duplicate evidence ID', (value) => { value.evidence.push(structuredClone(value.evidence[0])); }],
  ['orphan evidence', (value) => { value.evidence.push({ ...value.evidence[0], id: 'e2' }); }],
  ['zero-length evidence', (value) => { value.evidence[0].end = 0; }],
  ['reversed evidence', (value) => { value.evidence[0].start = 10; }],
  ['negative offset', (value) => { value.evidence[0].start = -1; }],
  ['fractional offset', (value) => { value.evidence[0].start = 0.5; }],
  ['span outside text', (value) => { value.evidence[0].end = 100; }],
  ['missing evidence source', (value) => { value.evidence[0].source = 'parentText'; }],
  ['excessive evidence', (value) => { value.evidence = Array.from({ length: LIMITS.evidence + 1 }, () => value.evidence[0]); }],
];

for (const [name, change] of invalidOutputs) {
  test(`invalid analyzer output: ${name}`, async () => {
    const engine = createAnalyzer(fixtureAnalyzer({ analyze() {
      const value = structuredClone(output);
      const changed = change(value);
      return changed === undefined ? value : changed;
    } }));
    const result = await engine.analyze(request);
    assert.equal(result.status, 'failed');
    assert.equal(result.error.code, 'invalid_analyzer_output');
    assert.deepEqual(result.findings, []);
    assert.deepEqual(result.evidence, []);
    assert.deepEqual(result.modelVersions, { 'fixture-only': 'fixture-v1' });
  });
}

test('splitting a Unicode surrogate pair in evidence is rejected', async () => {
  const engine = createAnalyzer(fixtureAnalyzer({ analyze: () => ({
    ...output, evidence: [{ ...output.evidence[0], end: 1 }],
  }) }));
  const result = await engine.analyze({ ...request, content: { kind: 'text', text: '😀 fixture' } });
  assert.equal(result.error.code, 'invalid_analyzer_output');
});
