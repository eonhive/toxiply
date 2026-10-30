/**
 * Company: EonHive Inc. | Title: Optional native text analyzer
 * Purpose: Expose extracted heuristics through the versioned analysis contract.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import type { TextAnalyzer } from './contracts/analyzer.js';
import type { AnalysisRequest, Category, TextAnalysis } from './contracts/schemas.js';
import { analyzeNativeContent } from './native/analyze-native-content.js';
import type { ToxiplySignals } from './native/types.js';

const SCORE_KEYS: Partial<Record<Category, keyof ToxiplySignals['scores']>> = {
  toxicity: 'toxicity', harassment: 'harassment', hate: 'hate',
  threat: 'threat', sexual_risk: 'sexualRisk',
};

function assess(request: AnalysisRequest): TextAnalysis {
  const context = request.context;
  const signals = analyzeNativeContent({
    text: request.content.text,
    ...(context?.parentText === undefined ? {} : { parentText: context.parentText }),
    ...(context?.quotedText === undefined ? {} : { quotedText: context.quotedText }),
    ...(context?.replyTarget === undefined ? {} : { replyTarget: context.replyTarget }),
    ...(context?.languageHint === undefined ? {} : { language: context.languageHint }),
  });
  const findings = request.categories.map((category) => {
    const key = SCORE_KEYS[category];
    if (key === undefined) throw new Error('Unsupported native category');
    return { category, score: signals.scores[key], evidenceIds: [] as string[] };
  });
  if (!findings.some((finding) => finding.score > 0)) return { findings, evidence: [] };

  // Legacy heuristics have no token-level attribution. These spans identify
  // whole assessed fields, not precise harmful phrases or calibrated evidence.
  const evidence: TextAnalysis['evidence'] = [{
    id: 'native-text', code: 'native_text.heuristic_assessment',
    source: 'text', start: 0, end: request.content.text.length,
  }];
  for (const source of ['parentText', 'quotedText'] as const) {
    const text = context?.[source];
    if (text !== undefined) evidence.push({
      id: `native-${source}`, code: 'native_text.semantic_context',
      source, start: 0, end: text.length,
    });
  }
  for (const finding of findings) {
    if (finding.score > 0) finding.evidenceIds = evidence.map((item) => item.id);
  }
  return { findings, evidence };
}

export const nativeTextAnalyzer: TextAnalyzer = {
  descriptor: {
    id: 'native_content', version: 'native-content-heuristic-v2',
    categories: ['toxicity', 'harassment', 'hate', 'threat', 'sexual_risk'],
    languages: ['en', 'und'], supportsContext: true,
  },
  analyze: assess,
};
