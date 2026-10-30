/**
 * Company: EonHive Inc. | Title: Offline profanity evaluation command
 * Purpose: Print a reproducible diagnostic report with label-review provenance.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { readFile } from 'node:fs/promises';
import { evaluateDataset } from './evaluate.mjs';

const dataset = await readFile(new URL('./english-profanity.v1.json', import.meta.url), 'utf8');
const report = await evaluateDataset(dataset);
console.log(JSON.stringify(report, null, 2));
