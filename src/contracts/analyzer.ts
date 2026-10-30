/**
 * Company: EonHive Inc. | Title: Local text analyzer interface
 * Purpose: Connect one optional analyzer without any platform or service dependency.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import type { AnalysisRequest, AnalysisResult, TextAnalysis, TextAnalyzerDescriptor } from './schemas.js';

export interface TextAnalyzer {
  readonly descriptor: TextAnalyzerDescriptor;
  analyze(request: AnalysisRequest): TextAnalysis | Promise<TextAnalysis>;
}

export interface ContentAnalyzer {
  analyze(request: unknown): Promise<AnalysisResult>;
}
