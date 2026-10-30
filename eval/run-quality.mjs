/**
 * Company: EonHive Inc. | Title: Paired quality comparison command
 * Purpose: Compare the frozen native baseline and attribution candidate on both public datasets.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { readFile } from 'node:fs/promises';
import { compareQualityDataset } from './compare-quality.mjs';

const reports = [];
for (const name of ['native-text.v1.json', 'context-attribution.v1.json']) {
  reports.push(await compareQualityDataset(await readFile(new URL(name, import.meta.url), 'utf8')));
}
console.log(JSON.stringify({ validationStatus: 'provisional_development_diagnostics_only', reports }, null, 2));
