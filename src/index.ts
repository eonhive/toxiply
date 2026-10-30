/**
 * Company: EonHive Inc. | Title: Public library exports
 * Purpose: Expose the independent Toxiply contracts and entry points.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
export { analyze, createAnalyzer } from './analyze.js';
export { createEnglishProfanityAnalyzer } from './text/english-profanity.js';
export {
  analysisRequestSchema, analysisResultSchema, categorySchema,
  ENGINE_VERSION, LIMITS, requestJsonSchema, resultJsonSchema, SCHEMA_VERSION, TAXONOMY_VERSION,
} from './contracts/schemas.js';
export type {
  AnalysisRequest, AnalysisResult, Category, MissingCapability,
  TextAnalysis, TextAnalyzerDescriptor,
} from './contracts/schemas.js';
export type { ContentAnalyzer, TextAnalyzer } from './contracts/analyzer.js';
