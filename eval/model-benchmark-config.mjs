/**
 * Company: EonHive Inc. | Title: Explicit model benchmark configuration
 * Purpose: Bind optional inference authorization, frozen inputs and runtime provenance.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import { realpath, stat } from 'node:fs/promises';
import { dirname, relative, resolve, sep, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createModelTextAnalyzer, createChatCompletionsClient } from '@eonhive/toxiply';
import { MODEL_INSTRUCTIONS } from '../dist/model/protocol.js';
import { loadReviewDataset, sha256, readDatasetText } from './review-dataset.mjs';

const description = z.string().min(1).max(1024).regex(/\S/u);
const identity = z.string().min(1).max(128).regex(/^[^\x00-\x1f\x7f]+$/u).regex(/\S/u);
const hash = z.string().regex(/^[a-f0-9]{64}$/u);
export const BENCHMARK_PROMPT_SHA256 = sha256(MODEL_INSTRUCTIONS);
export class BenchmarkError extends Error {
  constructor(code) { super(code); this.code = code; }
}
export const benchmarkConfigSchema = z.strictObject({
  schemaVersion: z.literal('toxiply.model-benchmark.v1'),
  mode: z.enum(['live', 'mock']), benchmarkId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/u),
  authorization: z.strictObject({ approvedBy: description, approvedAt: z.iso.datetime(),
    modelUseAuthorized: z.literal(true), endpointUseAuthorized: z.literal(true),
    dataUseAuthorized: z.literal(true), permissionRecord: description,
    privacyRetentionAccessRecord: description }).nullable(),
  model: z.strictObject({ id: identity, version: identity, checkpointRevision: description,
    quantization: description, configuration: description,
    license: z.strictObject({ identifier: description, reference: description, usePermissionRecord: description }) }),
  client: z.strictObject({ id: identity, version: identity,
    promptRevision: z.literal('model-json-v2'), promptSha256: z.literal(BENCHMARK_PROMPT_SHA256) }),
  endpoint: z.strictObject({ url: z.string().min(1).max(2048), allowedOrigins: z.array(z.string().min(1).max(2048)).min(1).max(16),
    allowInsecureLoopback: z.boolean(), credentialEnv: z.string().regex(/^[A-Z][A-Z0-9_]{0,127}$/u).nullable() }).nullable(),
  profile: z.strictObject({ categories: z.array(z.enum(['toxicity','harassment','hate','threat','sexual_risk','spam_scam'])).min(1).max(6),
    languages: z.array(z.string().regex(/^[a-z]{2,8}(-[a-z0-9]{1,8})*$/u).max(35)).min(1).max(32), supportsContext: z.boolean() }),
  execution: z.strictObject({ timeoutMs: z.number().int().min(1).max(120000),
    maxResponseBytes: z.number().int().min(1).max(1048576), maxCases: z.number().int().min(1).max(1000) }),
  dataset: z.strictObject({ id: identity, version: identity, sha256: hash, referenceSha256: z.array(hash).max(64) }),
  runtime: z.strictObject({ server: description, hardware: description, software: description, notes: description }),
}).superRefine((config, ctx) => {
  if ((config.mode === 'live' && (!config.authorization || !config.endpoint
      || config.client.id !== 'chat-completions-json' || config.client.version !== 'chat-json-v1'))
    || (config.mode === 'mock' && (config.authorization !== null || config.endpoint !== null))
    || new Set(config.profile.categories).size !== config.profile.categories.length
    || new Set(config.profile.languages).size !== config.profile.languages.length
    || new Set(config.dataset.referenceSha256).size !== config.dataset.referenceSha256.length) {
    ctx.addIssue({ code: 'custom', message: 'Inconsistent benchmark declarations.' });
  }
});

export function prepareBenchmark(configText, datasetText, referenceTexts = []) {
  try {
    if (Buffer.byteLength(configText, 'utf8') > 65536) throw new Error();
    const config = benchmarkConfigSchema.parse(JSON.parse(configText));
    const loaded = loadReviewDataset(datasetText, referenceTexts);
    if (loaded.legacy || loaded.dataset.datasetId !== config.dataset.id
      || loaded.dataset.datasetVersion !== config.dataset.version || loaded.datasetSha256 !== config.dataset.sha256
      || loaded.dataset.cases.length > config.execution.maxCases
      || JSON.stringify([...loaded.referenceHashes].sort()) !== JSON.stringify([...config.dataset.referenceSha256].sort())) {
      throw new BenchmarkError('dataset_binding_mismatch');
    }
    if (config.endpoint) createChatCompletionsClient({ endpoint: config.endpoint.url,
      allowedOrigins: config.endpoint.allowedOrigins, allowInsecureLoopback: config.endpoint.allowInsecureLoopback });
    // Reuse T7A configuration checks before any request is executed.
    createModelTextAnalyzer(modelOptions(config, { id: 'preflight-only', version: 'v1', infer: async () => { throw new Error(); } }));
    return { config, configSha256: sha256(configText), loaded };
  } catch (error) {
    throw error instanceof BenchmarkError ? error : new BenchmarkError('invalid_benchmark_configuration_or_dataset');
  }
}

export function modelOptions(config, client) {
  return { modelId: config.model.id, modelVersion: config.model.version, client,
    ...config.profile, timeoutMs: config.execution.timeoutMs, maxResponseBytes: config.execution.maxResponseBytes };
}

export function configuredClient(config) {
  if (config.mode !== 'live' || !config.endpoint || !config.authorization) throw new BenchmarkError('live_configuration_required');
  const apiKey = config.endpoint.credentialEnv ? process.env[config.endpoint.credentialEnv] : undefined;
  if (config.endpoint.credentialEnv && !apiKey) throw new BenchmarkError('credential_missing');
  return createChatCompletionsClient({ endpoint: config.endpoint.url, allowedOrigins: config.endpoint.allowedOrigins,
    allowInsecureLoopback: config.endpoint.allowInsecureLoopback, ...(apiKey ? { apiKey } : {}) });
}

export async function readPrivateBenchmarkConfig(path) {
  try {
    const actual = await realpath(path);
    const root = await realpath(fileURLToPath(new URL('..', import.meta.url)));
    const child = relative(root, actual);
    const inside = !isAbsolute(child) && child !== '..' && !child.startsWith(`..${sep}`);
    if (inside && !child.startsWith(`.local${sep}`)) throw new Error();
    for (let parent = dirname(actual); ; parent = dirname(parent)) {
      try {
        await stat(resolve(parent, '.git'));
        if (parent !== root) throw new BenchmarkError('private_configuration_required');
        break;
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (parent === dirname(parent)) break;
    }
    return await readDatasetText(actual);
  } catch { throw new BenchmarkError('private_configuration_required'); }
}
