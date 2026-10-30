/**
 * Company: EonHive Inc. | Title: Contextual attribution example
 * Purpose: Compare an opt-in quality candidate against the frozen baseline.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { createAnalyzer, contextualTextAnalyzer, nativeTextAnalyzer, SCHEMA_VERSION } from '@eonhive/toxiply';

const request = {
  schemaVersion: SCHEMA_VERSION, requestId: 'attribution-example',
  content: { kind: 'text', text: 'I reported the message "you are stupid".' },
  categories: ['toxicity', 'harassment'], context: { languageHint: 'en' },
};
for (const adapter of [nativeTextAnalyzer, contextualTextAnalyzer]) {
  console.log(JSON.stringify({ analyzer: adapter.descriptor, result: await createAnalyzer(adapter).analyze(request) }, null, 2));
}
