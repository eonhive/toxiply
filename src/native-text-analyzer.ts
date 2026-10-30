/**
 * Company: EonHive Inc. | Title: Optional native text analyzer
 * Purpose: Expose extracted heuristics through the versioned analysis contract.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import type { TextAnalyzer } from './contracts/analyzer.js';
import type { AnalysisRequest, Category, TextAnalysis } from './contracts/schemas.js';
import { analyzeNativeContentWithEvidence } from './native/analyze-native-content.js';
import type { ToxiplySignals } from './native/types.js';

const SCORE_KEYS: Partial<Record<Category, keyof ToxiplySignals['scores']>> = {
  toxicity: 'toxicity', harassment: 'harassment', hate: 'hate',
  threat: 'threat', sexual_risk: 'sexualRisk',
};

function assess(request: AnalysisRequest): TextAnalysis {
  const context = request.context;
  const { signals, evidence: traces } = analyzeNativeContentWithEvidence({
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

  const evidence: TextAnalysis['evidence'] = [];
  for (const trace of traces) {
    const supported = findings.filter((finding) => finding.score > 0 && trace.categories.includes(finding.category));
    if (supported.length === 0) continue;
    const id = `native-${evidence.length + 1}`;
    const { categories: _categories, ...span } = trace;
    evidence.push({ id, ...span });
    for (const finding of supported) finding.evidenceIds.push(id);
  }
  // A positive score without its actual matched rule is a programming error;
  // never invent a whole-field span merely to satisfy the public contract.
  if (findings.some((finding) => finding.score > 0 && finding.evidenceIds.length === 0)) {
    throw new Error('Native positive finding has no supporting rule evidence.');
  }
  return { findings, evidence };
}

export const nativeTextAnalyzer: TextAnalyzer = {
  descriptor: {
    id: 'native_content', version: 'native-content-heuristic-v2.evidence-v1',
    categories: ['toxicity', 'harassment', 'hate', 'threat', 'sexual_risk'],
    languages: ['en', 'und'], supportsContext: true,
  },
  analyze: assess,
};
Object.freeze(nativeTextAnalyzer.descriptor.categories);
Object.freeze(nativeTextAnalyzer.descriptor.languages);
Object.freeze(nativeTextAnalyzer.descriptor);
