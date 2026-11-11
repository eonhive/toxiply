/**
 * Company: EonHive Inc. | Title: Optional spam/scam example
 * Purpose: Demonstrate English-only content indicators without policy or actions.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import { createAnalyzer, createEnglishSpamScamAnalyzer, SCHEMA_VERSION } from '@eonhive/toxiply';

const engine = createAnalyzer(createEnglishSpamScamAnalyzer());
const result = await engine.analyze({
  schemaVersion: SCHEMA_VERSION, requestId: 'spam-example-1',
  content: { kind: 'text', text: 'Your account is suspended. Sign in here immediately to restore access.' },
  categories: ['spam_scam'], context: { languageHint: 'en' },
});
// Log only this synthetic example's result; the library itself never logs input.
console.log(JSON.stringify(result, null, 2));
