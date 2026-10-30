/**
 * Company: EonHive Inc. | Title: Diagnostic confusion metrics
 * Purpose: Count labeled outcomes without inventing undefined rates.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
export function summarize(outcomes) {
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
