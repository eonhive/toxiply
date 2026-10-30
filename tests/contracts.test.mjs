/**
 * Company: EonHive Inc. | Title: Portable contract tests
 * Purpose: Verify fixed results, public exports, and independent JSON Schema validation.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  analyze, analysisRequestSchema, analysisResultSchema, createAnalyzer,
  requestJsonSchema, resultJsonSchema,
} from '@eonhive/toxiply';
import { fixtureAnalyzer, request } from './helpers.mjs';

const fixture = JSON.parse(await readFile(new URL('./fixtures/analysis.v1.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ strict: true, allErrors: true });
const validateRequest = ajv.compile(requestJsonSchema);
const validateResult = ajv.compile(resultJsonSchema);

for (const item of fixture.cases) {
  test(`frozen contract: ${item.name}`, async () => {
    let engine = { analyze };
    if (item.mode === 'fixture') engine = createAnalyzer(fixtureAnalyzer());
    if (item.mode === 'throws') engine = createAnalyzer(fixtureAnalyzer({ analyze() { throw new Error('private error'); } }));
    const first = await engine.analyze(item.request);
    const second = await engine.analyze(item.request);
    assert.deepEqual(first, item.expected);
    assert.deepEqual(second, first);
    assert.deepEqual(JSON.parse(JSON.stringify(first)), first);
    assert.equal(analysisRequestSchema.safeParse(item.request).success, true);
    assert.equal(analysisResultSchema.safeParse(first).success, true);
    assert.equal(validateRequest(item.request), true, JSON.stringify(validateRequest.errors));
    assert.equal(validateResult(first), true, JSON.stringify(validateResult.errors));
  });
}

test('checked-in JSON schemas match runtime contracts', async () => {
  for (const [name, schema] of [['request', requestJsonSchema], ['result', resultJsonSchema]]) {
    const checkedIn = JSON.parse(await readFile(new URL(`../schemas/${name}.v1.json`, import.meta.url), 'utf8'));
    assert.deepEqual(checkedIn, schema, `Run npm run schemas:write for ${name}.`);
  }
});

test('JSON schemas reject unknown fields, versions, kinds and invalid scores', () => {
  assert.equal(validateRequest({ ...request, schemaVersion: 'toxiply.analysis.v2' }), false);
  assert.equal(validateRequest({ ...request, tenantId: 'forbidden' }), false);
  assert.equal(validateRequest({ ...request, content: { kind: 'image', text: 'not pixels' } }), false);
  const result = structuredClone(fixture.cases[1].expected);
  result.findings[0].score = 1.1;
  assert.equal(validateResult(result), false);
  result.findings[0].score = 0.5;
  result.confidence.calibrated = true;
  assert.equal(validateResult(result), false);
});

test('runtime result validation rejects inconsistent status, coverage and evidence', () => {
  const valid = fixture.cases[1].expected;
  const changes = [
    (result) => { result.findings[0].evidenceIds = ['missing']; },
    (result) => { result.evidence[0].end = 0; },
    (result) => { result.coverage.categories = []; },
    (result) => { result.modelVersions = {}; },
    (result) => { result.coverage.language = null; },
    (result) => { result.status = 'failed'; },
    (result) => { result.status = 'unsupported'; },
    (result) => { result.status = 'partial'; },
    (result) => { result.error = { code: 'analyzer_failed', issues: [] }; },
    (result) => { result.missingCapabilities = [{ capability: 'text_analysis', reason: 'not_supported' }]; },
  ];
  for (const change of changes) {
    const result = structuredClone(valid);
    change(result);
    assert.equal(analysisResultSchema.safeParse(result).success, false);
  }
});

test('package and runtime source remain independent of Flaggr and server infrastructure', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(pkg.dependencies), ['zod']);
  assert.equal(pkg.private, true);
  const forbiddenImport = /(?:from\s*|import\s*\(|require\s*\()\s*['"](?:@flaggr(?:\/|['"])|node:(?:http|https|net|child_process))/;
  async function checkDirectory(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
      if (entry.isDirectory()) await checkDirectory(url);
      else assert.doesNotMatch(await readFile(url, 'utf8'), forbiddenImport, entry.name);
    }
  }
  await checkDirectory(new URL('../src/', import.meta.url));
});
