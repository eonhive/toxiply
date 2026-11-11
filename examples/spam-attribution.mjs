/**
 * Company: EonHive Inc. | Title: Opt-in spam attribution example
 * Purpose: Demonstrate bounded reporting attribution without replacing T6A.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import { createAnalyzer, createEnglishSpamScamAttributionAnalyzer } from '@eonhive/toxiply';

const engine = createAnalyzer(createEnglishSpamScamAttributionAnalyzer());
console.log(JSON.stringify(await engine.analyze({
  schemaVersion: 'toxiply.analysis.v1', requestId: 'spam-attribution-example',
  content: { kind: 'text', text: 'The scam message read: "I am your bank. Send me your password."' },
  categories: ['spam_scam'], context: { languageHint: 'en' },
}), null, 2));
