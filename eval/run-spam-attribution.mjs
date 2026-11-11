/**
 * Company: EonHive Inc. | Title: Paired spam/scam attribution diagnostic
 * Purpose: Compare the frozen T6A baseline and opt-in T6B candidate on public development data.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import { readFile } from 'node:fs/promises';
import { createAnalyzer, createEnglishSpamScamAnalyzer,
  createEnglishSpamScamAttributionAnalyzer } from '@eonhive/toxiply';
import { compareReviewedDataset } from './evaluate-reviewed.mjs';

const reports = [];
for (const name of ['english-spam-scam.v1.json', 'spam-scam-attribution.v1.json']) {
  const text = await readFile(new URL(name, import.meta.url), 'utf8');
  const report = await compareReviewedDataset(text, [], {
    baseline: createAnalyzer(createEnglishSpamScamAnalyzer()),
    candidate: createAnalyzer(createEnglishSpamScamAttributionAnalyzer()),
  });
  if (report.executionFailed || report.baseline.totals.unassessedCases
    || report.candidate.totals.unassessedCases) throw new Error('Incomplete attribution diagnostic.');
  reports.push(report);
}
console.log(JSON.stringify({ reportVersion: 'toxiply.spam-attribution-run.v1', reports }, null, 2));
