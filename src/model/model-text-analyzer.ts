/**
 * Company: EonHive Inc. | Title: Optional model text analyzer
 * Purpose: Bound explicit inference and validate complete source-grounded results.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { TextAnalyzer } from '../contracts/analyzer.js';
import { analysisRequestSchema, evidenceConsistencyIssues, textAnalyzerDescriptorSchema } from '../contracts/schemas.js';
import type { AnalysisRequest, Category, TextAnalysis } from '../contracts/schemas.js';
import { MODEL_INSTRUCTIONS, modelOutputSchema } from './protocol.js';
import type { ModelInferenceClient } from './protocol.js';

export interface ModelTextAnalyzerOptions {
  modelId: string;
  modelVersion: string;
  client: ModelInferenceClient;
  categories: Exclude<Category, 'profanity'>[];
  languages: string[];
  supportsContext: boolean;
  timeoutMs: number;
  maxResponseBytes: number;
}

const name = z.string().min(1).max(128).regex(/^[^\x00-\x1f\x7f]+$/u);
const optionsSchema = z.strictObject({
  modelId: name, modelVersion: name,
  categories: z.array(z.enum(['toxicity', 'harassment', 'hate', 'threat', 'sexual_risk', 'spam_scam'])).min(1).max(6),
  languages: textAnalyzerDescriptorSchema.shape.languages,
  supportsContext: z.boolean(),
  timeoutMs: z.number().int().min(1).max(120_000),
  maxResponseBytes: z.number().int().min(1).max(1_048_576),
});

export function createModelTextAnalyzer(options: ModelTextAnalyzerOptions): TextAnalyzer {
  let config: z.infer<typeof optionsSchema>;
  let client: ModelInferenceClient;
  try {
    const { client: supplied, ...rest } = options;
    config = optionsSchema.parse(rest);
    if (new Set(config.categories).size !== config.categories.length
      || new Set(config.languages).size !== config.languages.length
      || !supplied || typeof supplied.infer !== 'function') throw new Error();
    client = { id: name.parse(supplied.id), version: name.parse(supplied.version), infer: supplied.infer.bind(supplied) };
  } catch { throw new Error('Invalid model analyzer configuration.'); }
  // V1 accepts one restricted analyzer identifier/version, not arbitrary provider
  // names. Hash non-secret model/client/capability metadata; retain the original
  // configuration out of band to interpret stored provenance. No schema changes.
  const fingerprint = createHash('sha256').update(JSON.stringify({ adapter: 'model-json-v1', ...config,
    clientId: client.id, clientVersion: client.version })).digest('hex').slice(0, 48);
  const descriptor = { id: 'model_text', version: `model-json-v1+${fingerprint}`,
    categories: [...config.categories], languages: [...config.languages], supportsContext: config.supportsContext };
  Object.freeze(descriptor.categories);
  Object.freeze(descriptor.languages);
  Object.freeze(descriptor);
  return { descriptor, async analyze(input: AnalysisRequest): Promise<TextAnalysis> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    try {
      const request = analysisRequestSchema.parse(input);
      const language = request.context?.languageHint ?? 'und';
      const hasContext = ['parentText', 'quotedText', 'replyTarget'].some(key =>
        request.context?.[key as keyof NonNullable<AnalysisRequest['context']>] !== undefined);
      if (!config.languages.includes(language) || request.categories.some(c => !config.categories.some(supported => supported === c))
        || (hasContext && !config.supportsContext)) throw new Error();
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error()); }, config.timeoutMs);
      });
      const raw = await Promise.race([deadline, client.infer({
        modelId: config.modelId, modelVersion: config.modelVersion, instructions: MODEL_INSTRUCTIONS,
        request: structuredClone(request), responseSchema: z.toJSONSchema(modelOutputSchema),
      }, { signal: controller.signal, maxResponseBytes: config.maxResponseBytes })]);
      if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > config.maxResponseBytes) throw new Error();
      const output = modelOutputSchema.parse(JSON.parse(raw));
      if (output.modelId !== config.modelId || output.modelVersion !== config.modelVersion
        || output.requestId !== request.requestId || output.language !== language
        || output.context !== (hasContext ? 'analyzed' : 'not_requested')
        || JSON.stringify(output.findings.map(f => f.category)) !== JSON.stringify(request.categories)
        || evidenceConsistencyIssues(output).length) throw new Error();
      if (output.findings.some(f => f.score === 0 && f.evidenceIds.length > 0)) throw new Error();
      for (const evidence of output.evidence) {
        const source = evidence.source === 'text' ? request.content.text : request.context?.[evidence.source];
        if (evidence.code !== 'model.source_span' || source === undefined || evidence.end > source.length
          || source.slice(evidence.start, evidence.end) !== evidence.quote || !evidence.quote.trim()
          || splitsPair(source, evidence.start) || splitsPair(source, evidence.end)) throw new Error();
      }
      return { findings: output.findings, evidence: output.evidence.map(({ quote: _quote, ...span }) => span) };
    } catch {
      // Do not expose provider errors, Zod input excerpts, response text or secrets.
      throw new Error('Model analysis failed.');
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      controller.abort();
    }
  } };
}

function splitsPair(text: string, offset: number): boolean {
  const before = text.charCodeAt(offset - 1);
  const after = text.charCodeAt(offset);
  return before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff;
}
