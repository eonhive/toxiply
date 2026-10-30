/**
 * Company: EonHive Inc. | Title: Minimal text invocation
 * Purpose: Show explicit capability handling without requiring a classifier.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { analyze, SCHEMA_VERSION } from '@eonhive/toxiply';

const result = await analyze({
  schemaVersion: SCHEMA_VERSION,
  requestId: 'example-1',
  content: { kind: 'text', text: 'Thanks for the thoughtful reply.' },
  categories: ['harassment'],
  context: { languageHint: 'en' },
});

console.log(JSON.stringify(result, null, 2));
