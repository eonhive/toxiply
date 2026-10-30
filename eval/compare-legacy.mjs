/**
 * Company: EonHive Inc. | Title: Frozen legacy content comparison
 * Purpose: Compare authorized local fixtures without publishing them or forcing V1 into a legacy shape.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { analysisRequestSchema, createAnalyzer, nativeTextAnalyzer } from '@eonhive/toxiply';
import { analyzeNativeContent } from '../dist/native/analyze-native-content.js';
import { summarize } from './metrics.mjs';
import { NATIVE_CATEGORIES } from './evaluate-native.mjs';

const scoreKeys = { toxicity: 'toxicity', harassment: 'harassment', hate: 'hate', threat: 'threat', sexual_risk: 'sexualRisk' };
const comparableFields = ['scores', 'subtype', 'severity', 'confidence', 'targeting', 'rationale', 'modelVersions', 'aggregatorVersion', 'sourceModalities', 'externalUsed'];
const signalSchema = z.strictObject({
  scores: z.strictObject(Object.fromEntries(['toxicity', 'harassment', 'hate', 'threat', 'sexualRisk', 'escalation'].map((key) => [key, z.number().min(0).max(1)]))),
  subtype: z.string(), severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.enum(['low', 'medium', 'high']), targeting: z.strictObject({ isTargeted: z.boolean(), targetType: z.string().optional() }),
  rationale: z.strictObject({ summary: z.string(), signals: z.array(z.string()) }),
  modelVersions: z.record(z.string(), z.string()), aggregatorVersion: z.string(),
  sourceModalities: z.array(z.string()), externalUsed: z.boolean(), routerVersion: z.string().optional(),
});
const reportSchema = z.object({
  dataset: z.object({ version: z.string(), sha256: z.string().regex(/^[a-f0-9]{64}$/), provenance: z.string() }),
  results: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9._:-]{1,128}$/), category: z.string(), text: z.string(),
    expectedFlag: z.boolean(), conversation: z.record(z.string(), z.unknown()).optional(), signals: signalSchema,
  })).min(1).max(256),
});

export async function compareLegacyReport(reportText) {
  const report = reportSchema.parse(JSON.parse(reportText));
  if (new Set(report.results.map((row) => row.id)).size !== report.results.length) throw new Error('Duplicate legacy case ID.');
  const engine = createAnalyzer(nativeTextAnalyzer);
  const cases = [];
  const legacyOutcomes = [];
  const nativeOutcomes = [];
  for (const row of report.results) {
    const input = analysisRequestSchema.safeParse({
      schemaVersion: 'toxiply.analysis.v1', requestId: row.id, content: { kind: 'text', text: row.text },
      categories: [...NATIVE_CATEGORIES], context: { languageHint: 'en', ...row.conversation },
    });
    const nonText = row.signals.sourceModalities.some((source) => !['text', 'conversation', 'multilingual'].includes(source));
    if (!input.success || row.signals.externalUsed || nonText) {
      cases.push({ id: row.id, status: 'unsupported', reason: !input.success ? 'outside_bounded_v1_request' : 'provider_or_media_legacy_path' });
      continue;
    }
    const result = await engine.analyze(input.data);
    if (result.status !== 'completed') throw new Error(`Incomplete public analysis for ${row.id}.`);
    const context = input.data.context;
    const actual = analyzeNativeContent({
      text: row.text, language: context.languageHint,
      ...(context.parentText === undefined ? {} : { parentText: context.parentText }),
      ...(context.quotedText === undefined ? {} : { quotedText: context.quotedText }),
      ...(context.replyTarget === undefined ? {} : { replyTarget: context.replyTarget }),
    });
    const differences = comparableFields.filter((field) => !isDeepStrictEqual(row.signals[field], actual[field]));
    const categoryDifferences = result.findings.filter((finding) => finding.score !== row.signals.scores[scoreKeys[finding.category]]).map((finding) => ({
      category: finding.category, legacy: row.signals.scores[scoreKeys[finding.category]], actual: finding.score,
    }));
    const expectedPresent = row.expectedFlag;
    const legacyPositive = row.signals.subtype !== 'harmless';
    const nativePositive = actual.subtype !== 'harmless';
    legacyOutcomes.push({ expectedPresent, actualPresent: legacyPositive });
    nativeOutcomes.push({ expectedPresent, actualPresent: nativePositive });
    const evidenceAttributionProblems = [];
    if (!expectedPresent && nativePositive && /quot/i.test(row.category)) {
      evidenceAttributionProblems.push('quoted_report_surface_evidence_does_not_establish_author_endorsement');
    }
    cases.push({
      id: row.id, status: 'compared', matchingContent: differences.length === 0,
      matchingPublicCategories: categoryDifferences.length === 0, differences, categoryDifferences,
      severityDifference: row.signals.severity === actual.severity ? null : { legacy: row.signals.severity, actual: actual.severity },
      intentionalDifferences: row.signals.routerVersion === actual.routerVersion ? [] : ['planner_identifier'],
      evidenceAttributionProblems,
    });
  }
  const compared = cases.filter((row) => row.status === 'compared');
  return {
    dataset: report.dataset, fixtureFileSha256: createHash('sha256').update(reportText).digest('hex'),
    modelVersions: nativeTextAnalyzer.descriptor,
    totals: {
      cases: cases.length, compared: compared.length, unsupported: cases.length - compared.length,
      matchingContent: compared.filter((row) => row.matchingContent).length,
      matchingPublicCategories: compared.filter((row) => row.matchingPublicCategories).length,
      categoryDifferences: compared.reduce((sum, row) => sum + row.categoryDifferences.length, 0),
      severityDifferences: compared.filter((row) => row.severityDifference !== null).length,
      attributionWarnings: compared.filter((row) => row.evidenceAttributionProblems.length > 0).length,
    },
    intentionalDifferences: ['independent_planner_identifier', 'versioned_rule_level_evidence_replaces_whole_field_assessment_spans'],
    notExposedInPublicV1: ['subtype', 'severity', 'heuristic_confidence_label', 'targeting', 'escalation', 'rationale', 'per_lane_versions'],
    excludedLegacyPaths: ['providers', 'media', 'tenant_history', 'policy', 'routing', 'actions'],
    diagnosticLabels: 'Provisional synthetic legacy labels; independent human review pending. Compatibility is not accuracy.',
    legacyDiagnostic: summarize(legacyOutcomes), nativeDiagnostic: summarize(nativeOutcomes), cases,
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  if (!process.argv[2]) {
    console.error('Usage: node eval/compare-legacy.mjs /absolute/path/to/authorized-frozen-report.json');
    process.exitCode = 2;
  } else {
    const report = await compareLegacyReport(await readFile(process.argv[2], 'utf8'));
    console.log(JSON.stringify(report, null, 2));
    if (report.totals.unsupported > 0 || report.totals.matchingContent !== report.totals.compared
      || report.totals.categoryDifferences > 0) process.exitCode = 1;
  }
}
