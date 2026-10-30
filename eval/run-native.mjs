/**
 * Company: EonHive Inc. | Title: Native text diagnostic command
 * Purpose: Run the public offline native-category evaluation.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { readFile } from 'node:fs/promises';
import { evaluateNativeDataset } from './evaluate-native.mjs';

const dataset = await readFile(new URL('./native-text.v1.json', import.meta.url), 'utf8');
console.log(JSON.stringify(await evaluateNativeDataset(dataset), null, 2));
