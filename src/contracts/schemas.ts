/**
 * Company: EonHive Inc. | Title: Analysis contracts
 * Purpose: Define versioned, portable request and result schemas.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { z } from 'zod';

export const SCHEMA_VERSION = 'toxiply.analysis.v1';
export const TAXONOMY_VERSION = 'toxiply.categories.v1';
export const ENGINE_VERSION = '0.2.0';
export const LIMITS = Object.freeze({
  text: 16_000,
  contextField: 4_000,
  contextTotal: 6_000,
  evidence: 64,
});

export const categorySchema = z.enum([
  'toxicity', 'harassment', 'hate', 'threat', 'sexual_risk', 'profanity', 'spam_scam',
]);
const identifierSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/);
const versionSchema = z.string().min(1).max(64).regex(/^[a-zA-Z0-9][a-zA-Z0-9._+-]*$/);
const capabilitySchema = z.string().regex(/^[a-z][a-z0-9_.-]{0,127}$/);
const languageSchema = z.string().regex(/^[a-z]{2,8}(-[a-z0-9]{1,8})*$/).max(35);
const categoriesSchema = z.array(categorySchema).max(categorySchema.options.length);
const contentTextSchema = z.string().min(1).max(LIMITS.text).regex(/\S/);
const contextTextSchema = z.string().min(1).max(LIMITS.contextField).regex(/\S/);

const requestShape = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  requestId: identifierSchema,
  content: z.strictObject({ kind: z.literal('text'), text: contentTextSchema }),
  categories: categoriesSchema.min(1),
  context: z.strictObject({
    parentText: contextTextSchema.optional(),
    quotedText: contextTextSchema.optional(),
    replyTarget: z.enum(['parent_author', 'group', 'self', 'unknown']).optional(),
    languageHint: languageSchema.optional(),
  }).optional(),
});

export const analysisRequestSchema = requestShape.superRefine((request, ctx) => {
  if (new Set(request.categories).size !== request.categories.length) {
    ctx.addIssue({ code: 'custom', path: ['categories'], message: 'Categories must be unique.' });
  }
  const contextLength = Array.from(request.context?.parentText ?? '').length
    + Array.from(request.context?.quotedText ?? '').length;
  if (contextLength > LIMITS.contextTotal) {
    ctx.addIssue({ code: 'custom', path: ['context'], message: 'Combined context exceeds its limit.' });
  }
});

export const evidenceSchema = z.strictObject({
  id: identifierSchema,
  code: capabilitySchema,
  source: z.enum(['text', 'parentText', 'quotedText']),
  start: z.number().int().min(0).max(LIMITS.text * 2),
  end: z.number().int().min(1).max(LIMITS.text * 2),
});
export const findingSchema = z.strictObject({
  category: categorySchema,
  score: z.number().min(0).max(1),
  evidenceIds: z.array(identifierSchema).max(LIMITS.evidence),
});
export const textAnalysisSchema = z.strictObject({
  findings: z.array(findingSchema).min(1).max(categorySchema.options.length),
  evidence: z.array(evidenceSchema).max(LIMITS.evidence),
});
export const textAnalyzerDescriptorSchema = z.strictObject({
  id: capabilitySchema,
  version: versionSchema,
  categories: categoriesSchema.min(1),
  languages: z.array(languageSchema).min(1).max(32),
  supportsContext: z.boolean(),
});

const missingCapabilitySchema = z.strictObject({
  capability: capabilitySchema,
  reason: z.enum(['not_configured', 'not_supported', 'execution_failed']),
});
const coverageSchema = z.strictObject({
  input: z.enum(['text', 'none']),
  categories: categoriesSchema,
  context: z.enum(['not_requested', 'analyzed', 'unsupported', 'not_analyzed']),
  language: languageSchema.nullable(),
});
const errorSchema = z.strictObject({
  code: z.enum(['invalid_request', 'invalid_analyzer', 'analyzer_failed', 'invalid_analyzer_output']),
  issues: z.array(z.strictObject({ path: z.string().max(256), code: z.string().max(64) })).max(16),
});

// Keep this structural schema exportable; cross-field checks live below.
const resultShape = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  taxonomyVersion: z.literal(TAXONOMY_VERSION),
  engineVersion: versionSchema,
  requestId: identifierSchema.nullable(),
  status: z.enum(['completed', 'partial', 'unsupported', 'failed']),
  findings: z.array(findingSchema).max(categorySchema.options.length),
  evidence: z.array(evidenceSchema).max(LIMITS.evidence),
  confidence: z.strictObject({ calibrated: z.literal(false) }),
  modelVersions: z.record(capabilitySchema, versionSchema),
  coverage: coverageSchema,
  missingCapabilities: z.array(missingCapabilitySchema).max(16),
  error: errorSchema.nullable(),
});

export const analysisResultSchema = resultShape.superRefine((result, ctx) => {
  const issues = resultConsistencyIssues(result);
  for (const message of issues) ctx.addIssue({ code: 'custom', message });
});

export type Category = z.infer<typeof categorySchema>;
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type AnalysisResult = z.infer<typeof resultShape>;
export type TextAnalysis = z.infer<typeof textAnalysisSchema>;
export type TextAnalyzerDescriptor = z.infer<typeof textAnalyzerDescriptorSchema>;
export type MissingCapability = z.infer<typeof missingCapabilitySchema>;

export function evidenceConsistencyIssues(analysis: TextAnalysis | AnalysisResult): string[] {
  const issues: string[] = [];
  const evidenceIds = new Set(analysis.evidence.map((item) => item.id));
  const categories = new Set(analysis.findings.map((finding) => finding.category));
  if (evidenceIds.size !== analysis.evidence.length) issues.push('Evidence IDs must be unique.');
  if (categories.size !== analysis.findings.length) issues.push('Findings must have unique categories.');
  const referenced = new Set<string>();
  for (const finding of analysis.findings) {
    if (finding.score > 0 && finding.evidenceIds.length === 0) {
      issues.push('Positive findings require evidence.');
    }
    if (new Set(finding.evidenceIds).size !== finding.evidenceIds.length) {
      issues.push('Evidence references must be unique.');
    }
    for (const id of finding.evidenceIds) {
      if (!evidenceIds.has(id)) issues.push('Evidence reference does not exist.');
      referenced.add(id);
    }
  }
  for (const evidence of analysis.evidence) {
    if (evidence.end <= evidence.start) issues.push('Evidence spans must be nonempty.');
    if (!referenced.has(evidence.id)) issues.push('Evidence must be referenced by a finding.');
  }
  return issues;
}

function resultConsistencyIssues(result: AnalysisResult): string[] {
  const issues = evidenceConsistencyIssues(result);
  const assessed = result.findings.map((finding) => finding.category);
  if (JSON.stringify(assessed) !== JSON.stringify(result.coverage.categories)) {
    issues.push('Coverage categories must match findings in order.');
  }
  const successful = result.status === 'completed' || result.status === 'partial';
  if (successful && (result.findings.length === 0 || result.coverage.input !== 'text'
    || Object.keys(result.modelVersions).length !== 1 || result.requestId === null
    || result.coverage.language === null)) {
    issues.push('Successful analysis requires findings, text coverage, provenance and a request ID.');
  }
  if (!successful && (result.findings.length > 0 || result.evidence.length > 0
    || result.coverage.input !== 'none' || result.coverage.context === 'analyzed')) {
    issues.push('Unsuccessful analysis cannot claim assessed content.');
  }
  if ((result.status === 'failed') !== (result.error !== null)) {
    issues.push('Only failed analysis has an error.');
  }
  if (result.status === 'completed' && (result.missingCapabilities.length > 0
    || !['not_requested', 'analyzed'].includes(result.coverage.context))) {
    issues.push('Completed analysis cannot have missing capabilities or context.');
  }
  if ((result.status === 'partial' || result.status === 'unsupported')
    && result.missingCapabilities.length === 0) {
    issues.push('Incomplete analysis requires missing capability metadata.');
  }
  if (result.status === 'unsupported' && result.requestId === null) {
    issues.push('Unsupported analysis requires a valid request ID.');
  }
  if (Object.keys(result.modelVersions).length > 1
    || (result.status === 'unsupported' && Object.keys(result.modelVersions).length > 0)) {
    issues.push('Provenance must describe at most one invoked analyzer.');
  }
  const missing = result.missingCapabilities.map((item) => item.capability);
  if (new Set(missing).size !== missing.length) issues.push('Missing capabilities must be unique.');
  if (!successful && result.coverage.language !== null) {
    issues.push('Unsuccessful analysis cannot claim language coverage.');
  }
  return issues;
}

// JSON Schema describes structure. Runtime validators also check bounded aggregate
// context, evidence references, and status/coverage consistency.
export const requestJsonSchema = z.toJSONSchema(analysisRequestSchema, { target: 'draft-2020-12' });
export const resultJsonSchema = z.toJSONSchema(analysisResultSchema, { target: 'draft-2020-12' });
