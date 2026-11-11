/**
 * Company: EonHive Inc. | Title: Explicit chat-completions inference client
 * Purpose: POST to one approved endpoint with bounded streaming reads and no redirects.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import type { ModelInferenceClient } from './protocol.js';

export interface ChatCompletionsClientOptions {
  endpoint: string;
  allowedOrigins: string[];
  allowInsecureLoopback?: boolean;
  apiKey?: string;
}

export function createChatCompletionsClient(options: ChatCompletionsClientOptions): ModelInferenceClient {
  let endpoint: URL;
  let authorization: string | undefined;
  try {
    endpoint = new URL(options.endpoint);
    const loopback = ['127.0.0.1', '[::1]'].includes(endpoint.hostname);
    if (!Array.isArray(options.allowedOrigins) || !options.allowedOrigins.includes(endpoint.origin)
      || endpoint.username || endpoint.password || endpoint.hash || endpoint.search
      || (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:'
        && loopback && options.allowInsecureLoopback === true))) throw new Error();
    if (options.apiKey !== undefined) {
      if (typeof options.apiKey !== 'string' || !options.apiKey.trim() || /[\r\n]/u.test(options.apiKey)) throw new Error();
      authorization = `Bearer ${options.apiKey}`;
    }
  } catch { throw new Error('Invalid model endpoint configuration.'); }
  const target = endpoint.href;
  return { id: 'chat-completions-json', version: 'chat-json-v1', async infer(input, limits) {
    try {
      const response = await fetch(target, {
        method: 'POST', redirect: 'error', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
        headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
        body: JSON.stringify({ model: input.modelId, temperature: 0, stream: false,
          messages: [{ role: 'system', content: input.instructions },
            { role: 'user', content: JSON.stringify({ modelId: input.modelId,
              modelVersion: input.modelVersion, request: input.request }) }],
          response_format: { type: 'json_schema', json_schema: {
            name: 'toxiply_model_output', strict: true, schema: input.responseSchema,
          } },
        }),
        signal: limits.signal,
      });
      if (!response.ok || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')
        || Number(response.headers.get('content-length')) > limits.maxResponseBytes) {
        void response.body?.cancel().catch(() => {});
        throw new Error();
      }
      if (!response.body) throw new Error();
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > limits.maxResponseBytes) throw new Error();
          chunks.push(value);
        }
      } finally { void reader.cancel().catch(() => {}); reader.releaseLock(); }
      const raw = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
      const envelope = JSON.parse(raw);
      const choice = envelope?.choices?.[0];
      if (envelope.model !== input.modelId || !Array.isArray(envelope.choices) || envelope.choices.length !== 1
        || choice.finish_reason !== 'stop' || choice.message?.role !== 'assistant'
        || typeof choice.message.content !== 'string' || choice.message.refusal
        || choice.message.tool_calls?.length || choice.message.function_call) throw new Error();
      return choice.message.content;
    } catch { throw new Error('Model transport failed.'); }
  } };
}
