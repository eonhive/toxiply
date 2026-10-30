/**
 * Company: EonHive Inc. | Title: Literal English profanity analyzer
 * Purpose: Report the first exact profanity-token match without inferring intent.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import type { TextAnalyzer } from '../contracts/analyzer.js';
import type { AnalysisRequest, TextAnalysis, TextAnalyzerDescriptor } from '../contracts/schemas.js';

// Independently authored vocabulary. Tokenization, vocabulary and scoring changes
// require a new descriptor version so recorded results remain interpretable.
const TERMS = new Set([
  'fuck', 'fucks', 'fucked', 'fucking',
  'shit', 'shits', 'shitty', 'bullshit',
  'bitch', 'bitches', 'asshole', 'assholes',
]);

export function createEnglishProfanityAnalyzer(): TextAnalyzer {
  const descriptor: TextAnalyzerDescriptor = {
    id: 'english-literal-profanity',
    version: 'literal-en-v1',
    categories: ['profanity'],
    languages: ['en'],
    supportsContext: false,
  };
  Object.freeze(descriptor.categories);
  Object.freeze(descriptor.languages);
  Object.freeze(descriptor);
  return { descriptor, analyze: analyzeProfanity };
}

function analyzeProfanity(request: AnalysisRequest): TextAnalysis {
  // Unicode letters, marks, numbers and underscores stay in one token. This
  // avoids treating an English substring inside a larger word as profanity.
  for (const token of request.content.text.matchAll(/[\p{L}\p{M}\p{N}_]+/gu)) {
    const word = token[0];
    if (!/^[a-zA-Z]+$/.test(word) || !TERMS.has(word.toLowerCase())) continue;
    // One witness proves this binary presence signal. This is not an occurrence
    // count or an exhaustive evidence list, even for very repetitive input.
    return {
      findings: [{ category: 'profanity', score: 1, evidenceIds: ['profanity-1'] }],
      evidence: [{
        id: 'profanity-1', code: 'profanity.literal_token', source: 'text',
        start: token.index, end: token.index + word.length,
      }],
    };
  }
  return { findings: [{ category: 'profanity', score: 0, evidenceIds: [] }], evidence: [] };
}
