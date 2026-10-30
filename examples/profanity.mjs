/**
 * Company: EonHive Inc. | Title: Literal profanity example
 * Purpose: Demonstrate opt-in offline analysis with explicit evidence and coverage.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { createAnalyzer, createEnglishProfanityAnalyzer, SCHEMA_VERSION } from '@eonhive/toxiply';

const engine = createAnalyzer(createEnglishProfanityAnalyzer());
const result = await engine.analyze({
  schemaVersion: SCHEMA_VERSION,
  requestId: 'profanity-example-1',
  content: { kind: 'text', text: 'The report quotes the word "shit".' },
  categories: ['profanity'],
  context: { languageHint: 'en' },
});

console.log(JSON.stringify(result, null, 2));
