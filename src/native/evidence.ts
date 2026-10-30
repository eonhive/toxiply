/**
 * Company: EonHive Inc. | Title: Native rule evidence
 * Purpose: Map normalized rule matches to their unchanged source fields.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import type { Category, TextAnalysis } from '../contracts/schemas.js';

export interface RuleEvidence extends Omit<TextAnalysis['evidence'][number], 'id'> {
  categories: readonly Category[];
}

export interface EvidenceText {
  normalized: string;
  record(pattern: RegExp, signal: string, categories: readonly Category[], evidence: RuleEvidence[]): boolean;
}

export function evidenceText(text: string, source: RuleEvidence['source']): EvidenceText {
  const leading = text.length - text.trimStart().length;
  const trimmed = text.trim();
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = leading;
  // Lowercasing can expand one code point (for example İ). Map every resulting
  // UTF-16 unit back to the original code point instead of reusing shifted indices.
  for (const point of trimmed) {
    for (let unit = 0; unit < point.toLowerCase().length; unit++) {
      starts.push(offset);
      ends.push(offset + point.length);
    }
    offset += point.length;
  }
  const normalized = trimmed.toLowerCase();
  return {
    normalized,
    record(pattern, signal, categories, evidence) {
      const match = pattern.exec(normalized);
      if (!match) return false;
      const start = starts[match.index];
      const end = ends[match.index + match[0].length - 1];
      if (start === undefined || end === undefined) throw new Error('Native evidence mapping failed.');
      evidence.push({ categories, code: signal.replaceAll(':', '.'), source, start, end });
      return true;
    },
  };
}
