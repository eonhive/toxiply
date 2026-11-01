/**
 * Company: EonHive Inc. | Title: Offline annotation handoff
 * Purpose: Prepare prediction-free review packets and reconcile explicitly submitted labels.
 * Author: Stan Nesi | Created: 2026-11-01 | Updated: 2026-11-01
 * Notes: Vibe coded with Codex.
 */
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { analysisRequestSchema, categorySchema, TAXONOMY_VERSION } from '@eonhive/toxiply';
import { DatasetError, loadReviewDataset, sha256 } from './review-dataset.mjs';

export const PACKET_SCHEMA = 'toxiply.text-review-packet.v1';
export const RESPONSE_SCHEMA = 'toxiply.text-review-response.v1';
const identifier = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/);
const description = z.string().min(1).max(4096).regex(/\S/u);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const span = z.strictObject({ category: categorySchema, source: z.enum(['text', 'parentText', 'quotedText']),
  start: z.number().int().min(0), end: z.number().int().min(1) });
const packetSchema = z.strictObject({
  schemaVersion: z.literal(PACKET_SCHEMA),
  source: z.strictObject({ datasetId: identifier, datasetVersion: identifier, datasetSha256: hash }),
  taxonomyVersion: z.literal(TAXONOMY_VERSION), labelDefinition: description,
  cases: z.array(z.strictObject({ id: identifier, request: analysisRequestSchema })).min(1).max(10_000),
}).superRefine((packet, ctx) => {
  packet.cases.forEach((item, index) => {
    if (item.id !== caseId(index) || item.request.requestId !== item.id) {
      ctx.addIssue({ code: 'custom', path: ['cases', index, 'id'], message: 'Invalid packet identifier.' });
    }
  });
});
const responseSchema = z.strictObject({
  schemaVersion: z.literal(RESPONSE_SCHEMA), packetSha256: hash, datasetVersion: identifier,
  reviewer: identifier, independentOfDevelopment: z.literal(true),
  annotations: z.array(z.strictObject({
    id: identifier, labels: z.partialRecord(categorySchema, z.boolean()),
    rationale: description, reviewedAt: z.iso.datetime(), evidenceSpans: z.array(span).max(64),
  })).min(1).max(10_000),
});
const caseId = (index) => `case-${String(index + 1).padStart(5, '0')}`;
export const reviewJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

function parseReview(text, schema, code) {
  let input;
  try { input = JSON.parse(text); } catch { throw new DatasetError('invalid_json'); }
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new DatasetError(code, parsed.error.issues.slice(0, 16)
    .map((item) => ({ code: item.code, path: item.path.slice(0, 3).join('.').slice(0, 256) })));
  return parsed.data;
}

export function prepareReviewPacket(datasetText, references = []) {
  const loaded = loadReviewDataset(datasetText, references);
  if (loaded.legacy) throw new DatasetError('review_requires_text_eval_v1');
  const { dataset, datasetSha256 } = loaded;
  return {
    schemaVersion: PACKET_SCHEMA,
    source: { datasetId: dataset.datasetId, datasetVersion: dataset.datasetVersion, datasetSha256 },
    taxonomyVersion: dataset.taxonomyVersion, labelDefinition: dataset.labelDefinition,
    // Opaque IDs hide label-bearing source IDs. Content and bounded context remain exact.
    cases: dataset.cases.map((item, index) => ({ id: caseId(index),
      request: { ...item.request, requestId: caseId(index) } })),
  };
}

export function prepareResponseTemplate(packetText) {
  const packet = parseReview(packetText, packetSchema, 'invalid_review_packet');
  // Nulls are deliberate: a template must never qualify as completed human review.
  return { schemaVersion: RESPONSE_SCHEMA, packetSha256: sha256(packetText), datasetVersion: null,
    reviewer: null, independentOfDevelopment: null,
    annotations: packet.cases.map((item) => ({ id: item.id,
      labels: Object.fromEntries(item.request.categories.map((category) => [category, null])),
      rationale: null, reviewedAt: null, evidenceSpans: [] })),
  };
}

export function applyReviewResponse(datasetText, packetText, responseText, references = []) {
  const expected = prepareReviewPacket(datasetText, references);
  const packet = parseReview(packetText, packetSchema, 'invalid_review_packet');
  if (!isDeepStrictEqual(packet, expected)) throw new DatasetError('review_packet_source_mismatch');
  const response = parseReview(responseText, responseSchema, 'invalid_review_response');
  if (response.packetSha256 !== sha256(packetText)) throw new DatasetError('review_packet_hash_mismatch');
  const { dataset } = loadReviewDataset(datasetText, references);
  if (response.datasetVersion === dataset.datasetVersion) throw new DatasetError('review_requires_new_version');
  const annotations = new Map(response.annotations.map((item) => [item.id, item]));
  if (annotations.size !== response.annotations.length || annotations.size !== packet.cases.length
    || packet.cases.some((item) => !annotations.has(item.id))) throw new DatasetError('review_case_mismatch');

  const revised = structuredClone(dataset);
  revised.datasetVersion = response.datasetVersion;
  revised.reviewStatus = 'human_reviewed';
  revised.cases = dataset.cases.map((item, index) => {
    const annotation = annotations.get(caseId(index));
    return { ...item, labels: annotation.labels, rationale: annotation.rationale,
      evidenceSpans: annotation.evidenceSpans,
      review: { status: 'human_reviewed', reviewer: response.reviewer,
        reviewedAt: annotation.reviewedAt, independentOfDevelopment: response.independentOfDevelopment } };
  });
  // Reuse the full dataset/category/source-span and held-out validation gates.
  // Split, provenance and input stay unchanged; review cannot create held-out independence.
  const datasetOutput = reviewJson(revised);
  const validated = loadReviewDataset(datasetOutput, references);
  const changes = dataset.cases.map((before, index) => {
    const after = revised.cases[index];
    return { id: before.id, packetCaseId: caseId(index),
      labels: before.request.categories.filter((category) => before.labels[category] !== after.labels[category])
        .map((category) => ({ category, before: before.labels[category], after: after.labels[category] })),
      rationaleChanged: before.rationale !== after.rationale,
      evidenceSpansChanged: !isDeepStrictEqual(before.evidenceSpans ?? [], after.evidenceSpans),
    };
  });
  return { datasetText: datasetOutput, audit: {
    schemaVersion: 'toxiply.text-review-audit.v1',
    sourceDatasetSha256: sha256(datasetText), packetSha256: sha256(packetText),
    responseSha256: sha256(responseText), datasetSha256: validated.datasetSha256,
    datasetId: revised.datasetId, datasetVersion: revised.datasetVersion, split: revised.split,
    reviewStatus: revised.reviewStatus, reviewer: response.reviewer, cases: revised.cases.length,
    changedLabels: changes.reduce((count, item) => count + item.labels.length, 0),
    referenceHashes: validated.referenceHashes, changes, attestations: validated.attestations,
  } };
}
