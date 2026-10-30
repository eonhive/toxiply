/**
 * Company: EonHive Inc. | Title: Optional native text example
 * Purpose: Invoke frozen heuristics explicitly and inspect actual coverage.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { createAnalyzer, nativeTextAnalyzer, SCHEMA_VERSION } from '@eonhive/toxiply';

const analyzer = createAnalyzer(nativeTextAnalyzer);
const result = await analyzer.analyze({
  schemaVersion: SCHEMA_VERSION,
  requestId: 'native-example',
  content: { kind: 'text', text: 'I will hurt you.' },
  categories: ['threat', 'harassment'],
  context: { languageHint: 'en' },
});

console.log(JSON.stringify(result, null, 2));
