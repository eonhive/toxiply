/**
 * Company: EonHive Inc. | Title: Canned inference client for adapter diagnostics
 * Purpose: Replay explicit synthetic responses without claiming trained classification.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import { readFile } from 'node:fs/promises';

const responses = JSON.parse(await readFile(new URL('./model-adapter.responses.v1.json', import.meta.url), 'utf8'));
export function fixtureResponse(input) {
  const fixture = responses[input.request.requestId];
  if (!fixture) throw new Error('Unknown synthetic fixture.');
  return { modelId: input.modelId, modelVersion: input.modelVersion,
    requestId: input.request.requestId, language: input.request.context?.languageHint ?? 'und',
    context: ['parentText','quotedText','replyTarget'].some(k => input.request.context?.[k] !== undefined)
      ? 'analyzed' : 'not_requested', ...structuredClone(fixture) };
}

export const fixtureModelClient = {
  id: 'fixture-only-client', version: 'fixture-v1',
  async infer(input) { return JSON.stringify(fixtureResponse(input)); },
};

export const fixtureModelOptions = {
  modelId: 'fixture-only/no-trained-model', modelVersion: 'fixture-v1', client: fixtureModelClient,
  categories: ['toxicity','harassment','hate','threat','sexual_risk','spam_scam'],
  languages: ['en'], supportsContext: true, timeoutMs: 1000, maxResponseBytes: 65536,
};
