/**
 * Company: EonHive Inc. | Title: Reviewable text evaluation datasets
 * Purpose: Validate provenance, review declarations and held-out separation offline.
 * Author: Stan Nesi | Created: 2026-10-31 | Updated: 2026-10-31
 * Notes: Vibe coded with Codex.
 */
import { createHash } from 'node:crypto';
import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { analysisRequestSchema, categorySchema, SCHEMA_VERSION, TAXONOMY_VERSION } from '@eonhive/toxiply';
import { nativeDatasetSchema, NATIVE_CATEGORIES } from './evaluate-native.mjs';

export const REVIEW_DATASET_SCHEMA = 'toxiply.text-eval.v1';
const identifier = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/);
const description = z.string().min(1).max(4096).regex(/\S/u);
const review = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('provisional') }),
  z.strictObject({ status: z.literal('human_reviewed'), reviewer: identifier,
    reviewedAt: z.iso.datetime(), independentOfDevelopment: z.literal(true) }),
]);
const span = z.strictObject({ category: categorySchema,
  source: z.enum(['text', 'parentText', 'quotedText']),
  start: z.number().int().min(0), end: z.number().int().min(1) });

export function validSourceSpan(item, request) {
  const source = item.source === 'text' ? request.content.text : request.context?.[item.source];
  if (!Number.isInteger(item.start) || !Number.isInteger(item.end) || item.start < 0
    || typeof source !== 'string' || item.start >= item.end || item.end > source.length
    || !source.slice(item.start, item.end).trim()) return false;
  const splitsPair = (offset) => /[\uD800-\uDBFF]/u.test(source[offset - 1] ?? '')
    && /[\uDC00-\uDFFF]/u.test(source[offset] ?? '');
  return !splitsPair(item.start) && !splitsPair(item.end);
}

export const reviewDatasetSchema = z.strictObject({
  schemaVersion: z.literal(REVIEW_DATASET_SCHEMA), datasetId: identifier, datasetVersion: identifier,
  taxonomyVersion: z.literal(TAXONOMY_VERSION), labelDefinition: description,
  split: z.enum(['development', 'human_reviewed', 'held_out']),
  reviewStatus: z.enum(['provisional', 'human_reviewed']),
  provenance: z.strictObject({ source: description,
    sourceKind: z.enum(['synthetic_development', 'independent_collection']),
    rights: description, visibility: z.enum(['public', 'private']),
    authors: z.array(identifier).min(1).max(64) }),
  holdout: z.strictObject({ frozenAt: z.iso.datetime(), notUsedForDevelopment: z.literal(true) }).optional(),
  cases: z.array(z.strictObject({
    id: identifier, group: identifier, tags: z.array(identifier).max(32),
    request: analysisRequestSchema, labels: z.partialRecord(categorySchema, z.boolean()),
    rationale: description, review,
    evidenceSpans: z.array(span).max(64).optional(),
  })).min(1).max(10_000),
}).superRefine((dataset, ctx) => {
  const issue = (path) => ctx.addIssue({ code: 'custom', path,
    message: 'Dataset declarations are inconsistent.' });
  if (new Set(dataset.cases.map((item) => item.id)).size !== dataset.cases.length) issue(['cases']);
  const allReviewed = dataset.cases.every((item) => item.review.status === 'human_reviewed');
  if ((dataset.reviewStatus === 'human_reviewed') !== allReviewed) issue(['reviewStatus']);
  if (dataset.split !== 'development' && !allReviewed) issue(['split']);
  if (dataset.split === 'held_out') {
    if (!dataset.holdout || dataset.provenance.sourceKind !== 'independent_collection') issue(['holdout']);
  } else if (dataset.holdout) issue(['holdout']);
  dataset.cases.forEach((item, index) => {
    if (item.id !== item.request.requestId) issue(['cases', index, 'request', 'requestId']);
    if (Object.keys(item.labels).length !== item.request.categories.length
      || item.request.categories.some((category) => typeof item.labels[category] !== 'boolean')) {
      issue(['cases', index, 'labels']);
    }
    if (new Set(item.tags).size !== item.tags.length) issue(['cases', index, 'tags']);
    if (item.review.status === 'human_reviewed' && dataset.provenance.authors.includes(item.review.reviewer)) {
      issue(['cases', index, 'review']);
    }
    for (const evidence of item.evidenceSpans ?? []) {
      if (item.labels[evidence.category] !== true || !validSourceSpan(evidence, item.request)) {
        issue(['cases', index, 'evidenceSpans']);
      }
    }
  });
});

export class DatasetError extends Error {
  constructor(code, issues = []) { super(code); this.code = code; this.issues = issues; }
}
export const sha256 = (text) => createHash('sha256').update(text).digest('hex');

function parseDataset(text) {
  let input;
  try { input = JSON.parse(text); } catch { throw new DatasetError('invalid_json'); }
  const legacy = input?.schemaVersion === 'toxiply.native-eval.v1';
  if (legacy) {
    const parsed = nativeDatasetSchema.safeParse(input);
    if (!parsed.success) throw new DatasetError('invalid_legacy_dataset');
    const original = parsed.data;
    const aliases = { criticism: 'product_criticism', reporting: 'quoted_reporting', harassment: 'personal_abuse' };
    input = {
      schemaVersion: REVIEW_DATASET_SCHEMA, datasetId: original.datasetId, datasetVersion: 'legacy-v1',
      taxonomyVersion: TAXONOMY_VERSION,
      labelDefinition: 'Existing native diagnostic current-author harm labels; reporting and product criticism are not endorsement. See docs/EVALUATION.md.',
      split: 'development', reviewStatus: 'provisional',
      provenance: { source: original.provenance, sourceKind: 'synthetic_development',
        rights: 'Legacy format does not record rights; verify original provenance before reuse.',
        visibility: 'private', authors: ['legacy-author-unrecorded'] },
      cases: original.cases.map((item) => ({
        id: item.id, group: item.group, tags: [aliases[item.group] ?? item.group],
        request: { schemaVersion: SCHEMA_VERSION, requestId: item.id,
          content: { kind: 'text', text: item.text }, categories: [...NATIVE_CATEGORIES],
          context: { languageHint: 'en', ...item.context } },
        labels: Object.fromEntries(NATIVE_CATEGORIES.map((category) => [category, item.expectedCategories.includes(category)])),
        rationale: item.rationale, review: { status: 'provisional' },
      })),
    };
  }
  const parsed = reviewDatasetSchema.safeParse(input);
  if (!parsed.success) throw new DatasetError('invalid_dataset', parsed.error.issues.slice(0, 16)
    .map((item) => ({ code: item.code, path: item.path.join('.').slice(0, 256) })));
  return { dataset: parsed.data, datasetSha256: sha256(text), legacy };
}

function contentFingerprint(item) {
  // Conservative overlap check ignores IDs/labels and catches case/spacing variants.
  // It does not establish semantic independence or detect paraphrases.
  return sha256(item.request.content.text.normalize('NFKC').toLowerCase().trim().replace(/\s+/gu, ' '));
}

export function loadReviewDataset(text, referenceTexts = []) {
  const loaded = parseDataset(text);
  const references = referenceTexts.map(parseDataset);
  if (loaded.dataset.split === 'held_out') {
    if (!references.some((item) => item.dataset.split === 'development')) {
      throw new DatasetError('held_out_requires_development_reference');
    }
    const seen = new Set(references.flatMap((item) => item.dataset.cases.map(contentFingerprint)));
    for (const item of loaded.dataset.cases) {
      const fingerprint = contentFingerprint(item);
      if (seen.has(fingerprint)) throw new DatasetError('held_out_content_overlap');
      seen.add(fingerprint);
    }
  }
  return { ...loaded, referenceHashes: references.map((item) => item.datasetSha256),
    attestations: 'Declared by dataset authors/reviewers; schema validation does not verify identity, rights or independence.' };
}

export async function readDatasetText(path) {
  const bytes = await readFile(path);
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { throw new DatasetError('invalid_utf8'); }
}

export async function importReviewDataset(source, directory, references = []) {
  const text = await readDatasetText(source);
  const loaded = loadReviewDataset(text, references);
  if (loaded.legacy) throw new DatasetError('import_requires_text_eval_v1');
  const destination = await writePrivateArtifact(directory,
    `${loaded.dataset.datasetId}@${loaded.dataset.datasetVersion}.json`, text,
    { existsCode: 'dataset_version_exists', failureCode: 'import_failed' });
  return { destination, datasetId: loaded.dataset.datasetId, datasetVersion: loaded.dataset.datasetVersion,
    datasetSha256: loaded.datasetSha256 };
}

// Review packets and revisions must use the same private, immutable destination rules.
export async function writePrivateArtifact(directory, filename, text,
  { existsCode = 'review_artifact_exists', failureCode = 'review_write_failed' } = {}) {
  if (!/^[a-z0-9][a-z0-9@._-]{0,279}$/u.test(filename)) throw new DatasetError('invalid_artifact_name');
  const root = await realpath(fileURLToPath(new URL('..', import.meta.url)));
  const destinationDirectory = await realpath(directory);
  const child = relative(root, destinationDirectory);
  const inside = !isAbsolute(child) && child !== '..' && !child.startsWith(`..${sep}`);
  if (inside && child !== '.local' && !child.startsWith(`.local${sep}`)) {
    throw new DatasetError('import_requires_ignored_or_external_directory');
  }
  for (let parent = destinationDirectory; ; parent = dirname(parent)) {
    let gitRoot = false;
    try { await stat(resolve(parent, '.git')); gitRoot = true; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (gitRoot) {
      if (parent !== root) throw new DatasetError('import_into_another_repository');
      break;
    }
    if (parent === dirname(parent)) break;
  }
  const destination = resolve(destinationDirectory, filename);
  try { await writeFile(destination, text, { flag: 'wx', mode: 0o600 }); }
  catch (error) { throw new DatasetError(error.code === 'EEXIST' ? existsCode : failureCode); }
  return destination;
}
