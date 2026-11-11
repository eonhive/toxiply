/**
 * Company: EonHive Inc. | Title: Spam/scam development comparison
 * Purpose: Reuse coverage-aware evaluation without treating unsupported native results as benign.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import { readFile } from 'node:fs/promises';
import { createAnalyzer, createEnglishSpamScamAnalyzer } from '@eonhive/toxiply';
import { compareReviewedDataset } from './evaluate-reviewed.mjs';

const text = await readFile(new URL('./english-spam-scam.v1.json', import.meta.url), 'utf8');
const report = await compareReviewedDataset(text, [], {
  candidate: createAnalyzer(createEnglishSpamScamAnalyzer()),
});
// This diagnostic deliberately supplies only supported English, current-text requests.
if (report.executionFailed || report.candidate.totals.unassessedCases
  || report.candidate.evidence.invalid) throw new Error('Spam/scam diagnostic execution was incomplete or invalid.');
console.log(JSON.stringify(report, null, 2));
