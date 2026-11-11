/**
 * Company: EonHive Inc. | Title: Explicit model endpoint example
 * Purpose: Process a synthetic request through an opt-in endpoint without logging source content.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import { createAnalyzer, createModelTextAnalyzer, createChatCompletionsClient } from '@eonhive/toxiply';

const endpoint = process.env.TOXIPLY_MODEL_ENDPOINT;
const modelId = process.env.TOXIPLY_MODEL_ID;
const modelVersion = process.env.TOXIPLY_MODEL_VERSION;
if (!endpoint || !modelId || !modelVersion) {
  console.log(JSON.stringify({ liveModel: 'NOT_RUN', reason: 'Explicit endpoint/model/version not configured.' }));
} else {
  try {
    const client = createChatCompletionsClient({ endpoint,
      allowedOrigins: [process.env.TOXIPLY_MODEL_ALLOWED_ORIGIN ?? ''],
      allowInsecureLoopback: process.env.TOXIPLY_MODEL_ALLOW_LOOPBACK === 'true',
      ...(process.env.TOXIPLY_MODEL_API_KEY ? { apiKey: process.env.TOXIPLY_MODEL_API_KEY } : {}),
    });
    const engine = createAnalyzer(createModelTextAnalyzer({ modelId, modelVersion, client,
      categories: ['harassment'], languages: ['en'], supportsContext: true,
      timeoutMs: 30000, maxResponseBytes: 65536,
    }));
    const result = await engine.analyze({ schemaVersion: 'toxiply.analysis.v1', requestId: 'model-example',
      content: { kind: 'text', text: 'You are an idiot.' }, categories: ['harassment'],
      context: { languageHint: 'en', parentText: 'Can you explain the issue?', replyTarget: 'parent_author' },
    });
    // Do not print source text, evidence quotes, credentials or raw model output.
    console.log(JSON.stringify({ status: result.status, coverage: result.coverage,
      modelVersions: result.modelVersions, scores: result.findings.map(({ category, score }) => ({ category, score })),
      error: result.error?.code ?? null }));
    if (result.status === 'failed') process.exitCode = 1;
  } catch { console.error('Model example configuration/execution failed.'); process.exitCode = 1; }
}
