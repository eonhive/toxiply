/**
 * Company: EonHive Inc. | Title: Native text diagnostic
 * Purpose: Measure public category outputs with explicit provisional labels.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { analysisRequestSchema, analysisResultSchema, createAnalyzer, nativeTextAnalyzer } from '@eonhive/toxiply';
import { summarize } from './metrics.mjs';

export const NATIVE_CATEGORIES = Object.freeze(['toxicity', 'harassment', 'hate', 'threat', 'sexual_risk']);
const datasetSchema = z.strictObject({
  schemaVersion: z.literal('toxiply.native-eval.v1'), datasetId: z.string().min(1).max(128),
  provenance: z.string().min(1), labelReview: z.literal('pending_human_review'),
  cases: z.array(z.strictObject({
    id: z.string().regex(/^[a-z0-9-]{1,128}$/), group: z.string().regex(/^[a-z_]{1,64}$/),
    text: z.string().min(1), context: analysisRequestSchema.shape.context,
    expectedCategories: z.array(z.enum(NATIVE_CATEGORIES)).max(5), rationale: z.string().min(1),
  })).min(1).max(256),
}).superRefine((dataset, ctx) => {
  if (new Set(dataset.cases.map((item) => item.id)).size !== dataset.cases.length
    || dataset.cases.some((item) => new Set(item.expectedCategories).size !== item.expectedCategories.length)) {
    ctx.addIssue({ code: 'custom', message: 'Case IDs and expected categories must be unique.' });
  }
});

export async function evaluateNativeDataset(datasetText, engine = createAnalyzer(nativeTextAnalyzer)) {
  const dataset = datasetSchema.parse(JSON.parse(datasetText));
  const outcomes = [];
  let versions;
  for (const item of dataset.cases) {
    const request = analysisRequestSchema.parse({
      schemaVersion: 'toxiply.analysis.v1', requestId: item.id,
      content: { kind: 'text', text: item.text }, categories: [...NATIVE_CATEGORIES],
      context: { languageHint: 'en', ...item.context },
    });
    const result = analysisResultSchema.parse(await engine.analyze(request));
    if (result.status !== 'completed' || result.requestId !== item.id
      || JSON.stringify(result.coverage.categories) !== JSON.stringify(NATIVE_CATEGORIES)) {
      throw new Error(`Case ${item.id} did not complete all native categories.`);
    }
    const currentVersions = { engineVersion: result.engineVersion, modelVersions: result.modelVersions };
    if (versions && JSON.stringify(versions) !== JSON.stringify(currentVersions)) throw new Error('Versions changed during evaluation.');
    versions = currentVersions;
    const predictedCategories = result.findings.filter((finding) => finding.score > 0).map((finding) => finding.category);
    outcomes.push({
      id: item.id, group: item.group, expectedCategories: item.expectedCategories, predictedCategories,
      expectedPresent: item.expectedCategories.length > 0, actualPresent: predictedCategories.length > 0,
      findings: result.findings, evidence: result.evidence,
    });
  }
  const groups = [...new Set(outcomes.map((item) => item.group))];
  return {
    datasetId: dataset.datasetId, datasetSha256: createHash('sha256').update(datasetText).digest('hex'),
    provenance: dataset.provenance, labelReview: dataset.labelReview,
    prediction: 'Category positive when its uncalibrated score is greater than zero; any positive category flags the case. No policy/action prediction.',
    ...versions, totals: summarize(outcomes),
    groups: Object.fromEntries(groups.map((group) => [group, summarize(outcomes.filter((item) => item.group === group))])),
    categories: Object.fromEntries(NATIVE_CATEGORIES.map((category) => [category, summarize(outcomes.map((item) => ({
      expectedPresent: item.expectedCategories.includes(category), actualPresent: item.predictedCategories.includes(category),
    })))])),
    mismatches: outcomes.filter((item) => item.expectedPresent !== item.actualPresent).map((item) => item.id),
    cases: outcomes,
  };
}
