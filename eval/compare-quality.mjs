/**
 * Company: EonHive Inc. | Title: Paired attribution quality diagnostics
 * Purpose: Report candidate improvements and regressions against unchanged labels and baseline.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { createAnalyzer, contextualTextAnalyzer, nativeTextAnalyzer } from '@eonhive/toxiply';
import { evaluateNativeDataset, NATIVE_CATEGORIES } from './evaluate-native.mjs';

export async function compareQualityDataset(
  datasetText,
  baselineEngine = createAnalyzer(nativeTextAnalyzer),
  candidateEngine = createAnalyzer(contextualTextAnalyzer),
) {
  const baseline = await evaluateNativeDataset(datasetText, baselineEngine);
  const candidate = await evaluateNativeDataset(datasetText, candidateEngine);
  const changedCases = [];
  const totals = { fixedFalsePositives: 0, newFalsePositives: 0, fixedFalseNegatives: 0, newFalseNegatives: 0, categoryImprovements: 0, categoryRegressions: 0 };
  for (let index = 0; index < baseline.cases.length; index++) {
    const before = baseline.cases[index];
    const after = candidate.cases[index];
    if (before.id !== after.id) throw new Error('Paired evaluation case mismatch.');
    const improved = [];
    const regressed = [];
    for (const category of NATIVE_CATEGORIES) {
      const expected = before.expectedCategories.includes(category);
      const previous = before.predictedCategories.includes(category);
      const current = after.predictedCategories.includes(category);
      if (previous !== expected && current === expected) improved.push(category);
      if (previous === expected && current !== expected) regressed.push(category);
    }
    totals.categoryImprovements += improved.length;
    totals.categoryRegressions += regressed.length;
    if (!before.expectedPresent && before.actualPresent && !after.actualPresent) totals.fixedFalsePositives++;
    if (!before.expectedPresent && !before.actualPresent && after.actualPresent) totals.newFalsePositives++;
    if (before.expectedPresent && !before.actualPresent && after.actualPresent) totals.fixedFalseNegatives++;
    if (before.expectedPresent && before.actualPresent && !after.actualPresent) totals.newFalseNegatives++;
    if (JSON.stringify(before.findings) !== JSON.stringify(after.findings) || JSON.stringify(before.evidence) !== JSON.stringify(after.evidence)) {
      changedCases.push({
        id: before.id, group: before.group, expectedCategories: before.expectedCategories,
        improvedCategories: improved, regressedCategories: regressed,
        baseline: { findings: before.findings, evidence: before.evidence },
        candidate: { findings: after.findings, evidence: after.evidence },
      });
    }
  }
  const summary = (report) => ({
    engineVersion: report.engineVersion, modelVersions: report.modelVersions,
    totals: report.totals, categories: report.categories,
    groups: report.groups, mismatches: report.mismatches,
  });
  return {
    datasetId: baseline.datasetId, datasetSha256: baseline.datasetSha256,
    provenance: baseline.provenance, labelReview: baseline.labelReview,
    validationStatus: 'provisional_development_diagnostics_only',
    baseline: summary(baseline), candidate: summary(candidate), totals, changedCases,
  };
}
