/**
 * Company: EonHive Inc. | Title: Synthetic model adapter diagnostic
 * Purpose: Report fixture execution separately from unavailable live-model quality.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createAnalyzer, createModelTextAnalyzer } from '@eonhive/toxiply';
import { evaluateReviewedDataset } from './evaluate-reviewed.mjs';
import { fixtureModelOptions } from './model-fixture-client.mjs';

const text = await readFile(new URL('./model-adapter.v1.json', import.meta.url), 'utf8');
const responses = await readFile(new URL('./model-adapter.responses.v1.json', import.meta.url), 'utf8');
const report = await evaluateReviewedDataset(text, createAnalyzer(createModelTextAnalyzer(fixtureModelOptions)));
console.log(JSON.stringify({ reportVersion: 'toxiply.model-adapter-diagnostic.v1',
  inference: 'CANNED_FIXTURE_REPLAY_NOT_MODEL_QUALITY', liveModel: 'NOT_RUN',
  responsesSha256: createHash('sha256').update(responses).digest('hex'), report }, null, 2));
if (report.executionFailures.length) process.exitCode = 1;
