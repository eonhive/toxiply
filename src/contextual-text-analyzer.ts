/**
 * Company: EonHive Inc. | Title: Contextual attribution candidate
 * Purpose: Opt into narrow attribution changes while keeping the native baseline frozen.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import type { TextAnalyzer } from './contracts/analyzer.js';
import type { AnalysisRequest, TextAnalysis } from './contracts/schemas.js';
import { attributeText } from './contextual/attribution.js';
import { nativeTextAnalyzer } from './native-text-analyzer.js';

async function assess(request: AnalysisRequest): Promise<TextAnalysis> {
  const current = attributeText(request.content.text);
  const parentText = request.context?.parentText;
  const parent = parentText === undefined ? undefined : attributeText(parentText);
  if (current.excluded.length === 0 && (parent?.excluded.length ?? 0) === 0) {
    return nativeTextAnalyzer.analyze(request);
  }
  const prepared: AnalysisRequest = { ...request, content: { ...request.content, text: current.text } };
  if (parent !== undefined && request.context !== undefined) prepared.context = { ...request.context, parentText: parent.text };
  const result = await nativeTextAnalyzer.analyze(prepared);
  // Refuse evidence crossing a masked passage; an artificial cross-boundary
  // regex match must never become a source witness. Ambiguity keeps baseline behavior.
  const crossesExcluded = result.evidence.some((item) => {
    if (item.source === 'quotedText') return false;
    const ranges = item.source === 'text' ? current.excluded : parent?.excluded ?? [];
    return ranges.some((range) => item.start < range.end && item.end > range.start);
  });
  return crossesExcluded ? nativeTextAnalyzer.analyze(request) : result;
}

export const contextualTextAnalyzer: TextAnalyzer = {
  descriptor: {
    ...nativeTextAnalyzer.descriptor,
    id: 'contextual_content', version: 'contextual-attribution-v1',
  },
  analyze: assess,
};
Object.freeze(contextualTextAnalyzer.descriptor);
