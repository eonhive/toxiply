/**
 * Company: EonHive Inc. | Title: Coverage-aware paired text evaluation
 * Purpose: Measure supported labels and evidence without treating missing analysis as benign.
 * Author: Stan Nesi | Created: 2026-10-31 | Updated: 2026-10-31
 * Notes: Vibe coded with Codex.
 */
import { analysisResultSchema, categorySchema, createAnalyzer,
  contextualTextAnalyzer, nativeTextAnalyzer } from '@eonhive/toxiply';
import { DatasetError, loadReviewDataset, sha256, validSourceSpan } from './review-dataset.mjs';
import { summarize } from './metrics.mjs';

const ratio = (numerator, denominator) => denominator ? numerator / denominator : null;
const hasContext = (request) => ['parentText', 'quotedText', 'replyTarget']
  .some((key) => request.context?.[key] !== undefined);

function auditEvidence(item, result, assessedCategories) {
  const audit = { checked: result.evidence.length,
    invalid: result.evidence.filter((entry) => !validSourceSpan(entry, item.request)).length,
    annotatedSpans: 0, matchedAnnotations: 0, unassessedAnnotations: 0,
    annotatedLinks: 0, alignedLinks: 0 };
  const annotations = item.evidenceSpans ?? [];
  const contains = (gold, actual) => gold.source === actual.source
    && gold.start <= actual.start && gold.end >= actual.end;
  for (const gold of annotations) {
    if (!assessedCategories.includes(gold.category)) { audit.unassessedAnnotations++; continue; }
    audit.annotatedSpans++;
    const finding = result.findings.find((entry) => entry.category === gold.category);
    if (result.evidence.some((entry) => finding?.evidenceIds.includes(entry.id) && contains(gold, entry))) {
      audit.matchedAnnotations++;
    }
  }
  for (const finding of result.findings) {
    const gold = annotations.filter((entry) => entry.category === finding.category);
    if (!gold.length || !assessedCategories.includes(finding.category)) continue;
    for (const id of finding.evidenceIds) {
      audit.annotatedLinks++;
      if (gold.some((entry) => contains(entry, result.evidence.find((entry) => entry.id === id)))) {
        audit.alignedLinks++;
      }
    }
  }
  return audit;
}

async function assessCase(item, engine) {
  let result;
  let failure = null;
  try {
    const parsed = analysisResultSchema.safeParse(await engine.analyze(structuredClone(item.request)));
    if (parsed.success) result = parsed.data;
    else failure = 'invalid_result';
  } catch { failure = 'analyzer_exception'; }
  if (result && (result.requestId !== item.id
    || result.coverage.categories.some((category) => !item.request.categories.includes(category))
    || (['completed', 'partial'].includes(result.status)
      && result.coverage.language !== (item.request.context?.languageHint ?? 'und')))) failure = 'invalid_result';
  let assessedCategories = result && !failure && ['completed', 'partial'].includes(result.status)
    && (!hasContext(item.request) || result.coverage.context === 'analyzed')
    ? [...result.coverage.categories] : [];
  let evidenceAudit = result ? auditEvidence(item, result, assessedCategories) : {
    checked: 0, invalid: 0, annotatedSpans: 0, matchedAnnotations: 0,
    unassessedAnnotations: item.evidenceSpans?.length ?? 0, annotatedLinks: 0, alignedLinks: 0,
  };
  if (evidenceAudit.invalid) {
    failure = 'invalid_source_span';
    assessedCategories = [];
    evidenceAudit = auditEvidence(item, result, []);
  }
  const fullyAssessed = result?.status === 'completed'
    && assessedCategories.length === item.request.categories.length;
  const predictedCategories = result?.findings.filter((finding) => finding.score > 0)
    .map((finding) => finding.category) ?? [];
  return {
    id: item.id, group: item.group, tags: item.tags, requestSha256: sha256(JSON.stringify(item.request)),
    language: item.request.context?.languageHint ?? 'und', requestedCategories: item.request.categories,
    labels: item.labels, review: item.review, assessedCategories, fullyAssessed,
    expectedPresent: Object.values(item.labels).some(Boolean),
    actualPresent: fullyAssessed ? predictedCategories.length > 0 : null,
    predictedCategories, status: result?.status ?? 'invalid_result', failure,
    modelVersions: result?.modelVersions ?? {}, engineVersion: result?.engineVersion ?? null,
    coverage: result?.coverage ?? null, missingCapabilities: result?.missingCapabilities ?? [],
    errorCode: result?.error?.code ?? null,
    findings: result?.findings ?? [], evidence: result?.evidence ?? [], evidenceAudit,
  };
}

function caseMetrics(cases) {
  const assessed = cases.filter((item) => item.fullyAssessed);
  return { ...summarize(assessed), requestedCases: cases.length, unassessedCases: cases.length - assessed.length };
}

export async function evaluateReviewedDataset(text, engine = createAnalyzer(nativeTextAnalyzer), references = []) {
  const loaded = loadReviewDataset(text, references);
  const cases = [];
  for (const item of loaded.dataset.cases) cases.push(await assessCase(item, engine));
  const observedVersions = [...new Set(cases.filter((item) => item.assessedCategories.length)
    .map((item) => JSON.stringify({ engineVersion: item.engineVersion, modelVersions:
      Object.fromEntries(Object.entries(item.modelVersions).sort(([left], [right]) => left.localeCompare(right))) })))].map(JSON.parse);
  if (observedVersions.length > 1) throw new DatasetError('inconsistent_analyzer_versions');
  const categories = Object.fromEntries(categorySchema.options.map((category) => {
    const requested = cases.filter((item) => item.requestedCategories.includes(category));
    const assessed = requested.filter((item) => item.assessedCategories.includes(category));
    return [category, { ...summarize(assessed.map((item) => ({
      expectedPresent: item.labels[category], actualPresent: item.predictedCategories.includes(category),
    }))), requested: requested.length, unassessed: requested.length - assessed.length,
    falsePositiveIds: assessed.filter((item) => !item.labels[category] && item.predictedCategories.includes(category)).map((item) => item.id),
    falseNegativeIds: assessed.filter((item) => item.labels[category] && !item.predictedCategories.includes(category)).map((item) => item.id) }];
  }));
  const statusCounts = Object.fromEntries(['completed', 'partial', 'unsupported', 'failed', 'invalid_result']
    .map((status) => [status, cases.filter((item) => item.status === status).length]));
  const groupKeys = [...new Set(cases.map((item) => item.group))];
  const tags = [...new Set(cases.flatMap((item) => item.tags))];
  const languages = [...new Set(cases.map((item) => item.language))];
  const evidence = Object.fromEntries(Object.keys(cases[0].evidenceAudit)
    .map((key) => [key, cases.reduce((sum, item) => sum + item.evidenceAudit[key], 0)]));
  return {
    reportVersion: 'toxiply.text-quality-report.v1',
    dataset: { schemaVersion: loaded.legacy ? 'toxiply.native-eval.v1' : loaded.dataset.schemaVersion,
      datasetId: loaded.dataset.datasetId, datasetVersion: loaded.dataset.datasetVersion,
      taxonomyVersion: loaded.dataset.taxonomyVersion, labelDefinition: loaded.dataset.labelDefinition,
      split: loaded.dataset.split, reviewStatus: loaded.dataset.reviewStatus,
      provenance: loaded.dataset.provenance, datasetSha256: loaded.datasetSha256,
      referenceHashes: loaded.referenceHashes, holdout: loaded.dataset.holdout ?? null },
    interpretation: 'Scores > 0 are positive uncalibrated signals. No production accuracy or verified independence claim.',
    attestations: loaded.attestations, statusCounts, observedVersions,
    versionConsistency: observedVersions.length ? 'consistent' : 'not_assessed',
    executionFailures: cases.filter((item) => item.failure || item.status === 'failed').map((item) => item.id),
    totals: caseMetrics(cases), categories,
    groups: Object.fromEntries(groupKeys.map((key) => [key, caseMetrics(cases.filter((item) => item.group === key))])),
    slices: Object.fromEntries(tags.map((tag) => [tag, caseMetrics(cases.filter((item) => item.tags.includes(tag)))])),
    languages: Object.fromEntries(languages.map((language) => [language, {
      ...caseMetrics(cases.filter((item) => item.language === language)),
      unsupported: cases.filter((item) => item.language === language && item.status === 'unsupported').length,
    }])),
    evidence: { ...evidence, structuralValidity: ratio(evidence.checked - evidence.invalid, evidence.checked),
      annotatedLinkPrecision: ratio(evidence.alignedLinks, evidence.annotatedLinks),
      annotatedSpanRecall: ratio(evidence.matchedAnnotations, evidence.annotatedSpans),
      semanticScope: 'Only supplied annotations are assessed, under their declared review status. Structural validity is not semantic attribution correctness.' },
    cases,
  };
}

export async function compareReviewedDataset(text, references = [], engines = {}) {
  const baseline = await evaluateReviewedDataset(text, engines.baseline ?? createAnalyzer(nativeTextAnalyzer), references);
  const candidate = await evaluateReviewedDataset(text, engines.candidate ?? createAnalyzer(contextualTextAnalyzer), references);
  const deltas = [];
  const totals = { fixedFalsePositives: 0, newFalsePositives: 0, fixedFalseNegatives: 0, newFalseNegatives: 0,
    categoryImprovements: 0, categoryRegressions: 0, comparableCases: 0, uncomparableCases: 0 };
  for (let index = 0; index < baseline.cases.length; index++) {
    const before = baseline.cases[index];
    const after = candidate.cases[index];
    const comparable = before.assessedCategories.filter((category) => after.assessedCategories.includes(category));
    const improved = [];
    const regressed = [];
    for (const category of comparable) {
      const expected = before.labels[category];
      const previous = before.predictedCategories.includes(category);
      const current = after.predictedCategories.includes(category);
      if (previous !== expected && current === expected) improved.push(category);
      if (previous === expected && current !== expected) regressed.push(category);
    }
    totals.categoryImprovements += improved.length;
    totals.categoryRegressions += regressed.length;
    if (before.fullyAssessed && after.fullyAssessed) {
      totals.comparableCases++;
      if (!before.expectedPresent && before.actualPresent && !after.actualPresent) totals.fixedFalsePositives++;
      if (!before.expectedPresent && !before.actualPresent && after.actualPresent) totals.newFalsePositives++;
      if (before.expectedPresent && !before.actualPresent && after.actualPresent) totals.fixedFalseNegatives++;
      if (before.expectedPresent && before.actualPresent && !after.actualPresent) totals.newFalseNegatives++;
    } else totals.uncomparableCases++;
    deltas.push({ id: before.id, comparableCategories: comparable,
      improvedCategories: improved, regressedCategories: regressed });
  }
  return { reportVersion: 'toxiply.paired-text-quality.v1', dataset: baseline.dataset,
    executionFailed: [baseline, candidate].some((report) => report.executionFailures.length > 0),
    baseline, candidate, totals, deltas };
}
