/**
 * Company: EonHive Inc. | Title: Independent analysis entry point
 * Purpose: Validate bounded text input and report honest execution coverage.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import {
  analysisRequestSchema, analysisResultSchema, ENGINE_VERSION, evidenceConsistencyIssues,
  SCHEMA_VERSION, TAXONOMY_VERSION, textAnalysisSchema, textAnalyzerDescriptorSchema,
} from './contracts/schemas.js';
import type {
  AnalysisRequest, AnalysisResult, MissingCapability, TextAnalysis, TextAnalyzerDescriptor,
} from './contracts/schemas.js';
import type { ContentAnalyzer, TextAnalyzer } from './contracts/analyzer.js';

type AnalysisError = NonNullable<AnalysisResult['error']>;

export function createAnalyzer(textAnalyzer?: TextAnalyzer): ContentAnalyzer {
  return { analyze: (request) => runAnalysis(request, textAnalyzer) };
}

export async function analyze(request: unknown): Promise<AnalysisResult> {
  return runAnalysis(request);
}

async function runAnalysis(input: unknown, analyzer?: TextAnalyzer): Promise<AnalysisResult> {
  const parsed = analysisRequestSchema.safeParse(input);
  if (!parsed.success) {
    const candidateId = typeof input === 'object' && input !== null && 'requestId' in input
      ? input.requestId : null;
    const requestId = typeof candidateId === 'string'
      && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(candidateId) ? candidateId : null;
    return finish({
      ...emptyResult(requestId),
      status: 'failed',
      error: {
        code: 'invalid_request',
        // Issue codes and paths are enough for callers; never echo content/errors.
        issues: parsed.error.issues.slice(0, 16).map((issue) => ({
          path: issue.path.join('.').slice(0, 256), code: issue.code,
        })),
      },
    });
  }

  const request = parsed.data;
  const result = emptyResult(request.requestId, request);
  if (!analyzer) {
    result.missingCapabilities = [{ capability: 'text_analysis', reason: 'not_configured' }];
    return finish(result);
  }
  const descriptor = textAnalyzerDescriptorSchema.safeParse(analyzer.descriptor);
  if (!descriptor.success || typeof analyzer.analyze !== 'function'
    || new Set(descriptor.data.categories).size !== descriptor.data.categories.length
    || new Set(descriptor.data.languages).size !== descriptor.data.languages.length) {
    return failed(result, 'invalid_analyzer');
  }
  return execute(request, result, analyzer, descriptor.data);
}

async function execute(
  request: AnalysisRequest,
  result: AnalysisResult,
  analyzer: TextAnalyzer,
  descriptor: TextAnalyzerDescriptor,
): Promise<AnalysisResult> {
  // An absent hint is unknown, not evidence that the input is English.
  const language = request.context?.languageHint ?? 'und';
  const missing: MissingCapability[] = [];
  const categories = request.categories.filter((category) => {
    if (descriptor.categories.includes(category)) return true;
    missing.push({ capability: `category.${category}`, reason: 'not_supported' });
    return false;
  });
  if (!descriptor.languages.includes(language)) {
    missing.push({ capability: `language.${language.replaceAll('-', '.')}`, reason: 'not_supported' });
  }
  const hasContext = hasSemanticContext(request);
  if (hasContext && !descriptor.supportsContext) {
    missing.push({ capability: 'semantic_context', reason: 'not_supported' });
    result.coverage.context = 'unsupported';
  }
  result.missingCapabilities = missing;
  if (categories.length === 0 || !descriptor.languages.includes(language)) return finish(result);

  const analyzerRequest: AnalysisRequest = { ...request, categories };
  if (hasContext && !descriptor.supportsContext) {
    analyzerRequest.context = request.context?.languageHint
      ? { languageHint: request.context.languageHint } : {};
  }
  // Validation made a detached request. Retain our own copy so a local adapter
  // cannot alter the source text used to validate its returned evidence.
  result.modelVersions = { [descriptor.id]: descriptor.version };
  let rawOutput: unknown;
  try {
    rawOutput = await analyzer.analyze(structuredClone(analyzerRequest));
  } catch {
    return failed(result, 'analyzer_failed');
  }
  const output = textAnalysisSchema.safeParse(rawOutput);
  if (!output.success || !validTextAnalysis(output.data, analyzerRequest)) {
    return failed(result, 'invalid_analyzer_output');
  }

  result.findings = output.data.findings;
  result.evidence = output.data.evidence;
  result.coverage = {
    input: 'text',
    categories: result.findings.map((finding) => finding.category),
    context: hasContext ? (descriptor.supportsContext ? 'analyzed' : 'unsupported') : 'not_requested',
    language,
  };
  result.status = missing.length > 0 ? 'partial' : 'completed';
  return finish(result);
}

function validTextAnalysis(output: TextAnalysis, request: AnalysisRequest): boolean {
  if (evidenceConsistencyIssues(output).length > 0) return false;
  if (output.findings.length !== request.categories.length
    || output.findings.some((finding) => !request.categories.includes(finding.category))) return false;
  return output.evidence.every((evidence) => {
    const source = evidence.source === 'text' ? request.content.text : request.context?.[evidence.source];
    if (source === undefined || evidence.end > source.length) return false;
    // Offsets are UTF-16 indices and must not cut a surrogate pair in half.
    return !splitsSurrogatePair(source, evidence.start) && !splitsSurrogatePair(source, evidence.end);
  });
}

function splitsSurrogatePair(text: string, offset: number): boolean {
  const before = text.charCodeAt(offset - 1);
  const after = text.charCodeAt(offset);
  return before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff;
}

function hasSemanticContext(request: AnalysisRequest): boolean {
  return request.context?.parentText !== undefined || request.context?.quotedText !== undefined
    || request.context?.replyTarget !== undefined;
}

function emptyResult(requestId: string | null, request?: AnalysisRequest): AnalysisResult {
  return {
    schemaVersion: SCHEMA_VERSION,
    taxonomyVersion: TAXONOMY_VERSION,
    engineVersion: ENGINE_VERSION,
    requestId,
    status: 'unsupported',
    findings: [], evidence: [], confidence: { calibrated: false }, modelVersions: {},
    coverage: {
      input: 'none', categories: [], context: request && hasSemanticContext(request) ? 'not_analyzed' : 'not_requested',
      language: null,
    },
    missingCapabilities: [], error: null,
  };
}

function failed(result: AnalysisResult, code: AnalysisError['code']): AnalysisResult {
  return finish({
    ...result, status: 'failed',
    missingCapabilities: [{ capability: 'text_analysis', reason: 'execution_failed' }],
    error: { code, issues: [] },
  });
}

function finish(result: AnalysisResult): AnalysisResult {
  return analysisResultSchema.parse(result);
}
