/**
 * Company: EonHive Inc. | Title: Profanity diagnostic evaluator
 * Purpose: Measure labeled cases without treating unavailable analysis as benign.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  analysisResultSchema, createAnalyzer, createEnglishProfanityAnalyzer, LIMITS, SCHEMA_VERSION,
} from '@eonhive/toxiply';

const datasetSchema = z.strictObject({
  schemaVersion: z.literal('toxiply.profanity-eval.v1'),
  datasetId: z.string().regex(/^[a-z0-9-]{1,128}$/),
  definition: z.string().min(1),
  provenance: z.string().min(1),
  labelReview: z.strictObject({
    status: z.enum(['pending_human_review', 'reviewed']),
    reviewer: z.string().min(1).nullable(),
    reviewedAt: z.iso.date().nullable(),
  }),
  cases: z.array(z.strictObject({
    id: z.string().regex(/^[a-z0-9-]{1,128}$/),
    group: z.enum(['literal', 'quoting_reporting', 'unlisted', 'obfuscated', 'benign', 'boundaries']),
    text: z.string().min(1).max(LIMITS.text).regex(/\S/),
    expectedPresent: z.boolean(),
    rationale: z.string().min(1),
  })).min(1).max(256),
}).superRefine((dataset, ctx) => {
  if (new Set(dataset.cases.map((item) => item.id)).size !== dataset.cases.length) {
    ctx.addIssue({ code: 'custom', message: 'Case IDs must be unique.' });
  }
  const review = dataset.labelReview;
  const completeReview = review.reviewer !== null && review.reviewedAt !== null;
  if ((review.status === 'reviewed' && !completeReview)
    || (review.status === 'pending_human_review' && (review.reviewer !== null || review.reviewedAt !== null))) {
    ctx.addIssue({ code: 'custom', message: 'Review metadata must reflect the declared review status.' });
  }
});

export async function evaluateDataset(
  datasetText,
  engine = createAnalyzer(createEnglishProfanityAnalyzer()),
) {
  const dataset = datasetSchema.parse(JSON.parse(datasetText));
  const outcomes = [];
  let versions;
  for (const item of dataset.cases) {
    const result = analysisResultSchema.parse(await engine.analyze({
      schemaVersion: SCHEMA_VERSION, requestId: item.id,
      content: { kind: 'text', text: item.text }, categories: ['profanity'],
      context: { languageHint: 'en' },
    }));
    const finding = result.findings[0];
    if (result.status !== 'completed' || result.requestId !== item.id
      || result.findings.length !== 1 || finding?.category !== 'profanity'
      || (finding.score !== 0 && finding.score !== 1)) {
      throw new Error(`Case ${item.id} did not produce a completed binary profanity signal.`);
    }
    const currentVersions = {
      engineVersion: result.engineVersion, taxonomyVersion: result.taxonomyVersion, modelVersions: result.modelVersions,
    };
    if (versions && JSON.stringify(versions) !== JSON.stringify(currentVersions)) {
      throw new Error('Analyzer versions changed during evaluation.');
    }
    versions = currentVersions;
    outcomes.push({
      id: item.id, group: item.group, expectedPresent: item.expectedPresent,
      actualPresent: finding.score === 1, score: finding.score, evidence: result.evidence,
    });
  }
  const groups = [...new Set(outcomes.map((item) => item.group))];
  return {
    datasetId: dataset.datasetId,
    datasetSha256: createHash('sha256').update(datasetText).digest('hex'),
    definition: dataset.definition, provenance: dataset.provenance, labelReview: dataset.labelReview,
    ...versions,
    totals: summarize(outcomes),
    groups: Object.fromEntries(groups.map((group) => [group, summarize(outcomes.filter((item) => item.group === group))])),
    mismatches: outcomes.filter((item) => item.expectedPresent !== item.actualPresent).map((item) => item.id),
    cases: outcomes,
  };
}

function summarize(outcomes) {
  let truePositives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  for (const item of outcomes) {
    if (item.expectedPresent && item.actualPresent) truePositives++;
    else if (!item.expectedPresent && !item.actualPresent) trueNegatives++;
    else if (item.actualPresent) falsePositives++;
    else falseNegatives++;
  }
  const ratio = (numerator, denominator) => denominator === 0 ? null : numerator / denominator;
  return {
    cases: outcomes.length, truePositives, trueNegatives, falsePositives, falseNegatives,
    precision: ratio(truePositives, truePositives + falsePositives),
    recall: ratio(truePositives, truePositives + falseNegatives),
    falsePositiveRate: ratio(falsePositives, falsePositives + trueNegatives),
    falseNegativeRate: ratio(falseNegatives, falseNegatives + truePositives),
  };
}
