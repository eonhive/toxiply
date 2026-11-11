/**
 * Company: EonHive Inc. | Title: Opt-in spam/scam attribution candidate
 * Purpose: Exclude narrowly reported examples and negated credential instructions.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import type { TextAnalyzer } from '../contracts/analyzer.js';
import type { AnalysisRequest, TextAnalysis } from '../contracts/schemas.js';
import { createEnglishSpamScamAnalyzer } from './english-spam-scam.js';

type Span = { start: number; end: number };
const PAIRS: Readonly<Record<string, string>> = { '"': '"', '“': '”', "'": "'", '‘': '’', '`': '`' };
const FRAME = /\b(?:(?:the|a|this)\s+(?:(?:scam|phishing)\s+)?message\s+(?:read|said)|(?:the|an?)\s+(?:article|report|guide)\s+(?:quotes|quoted)|(?:scam|phishing)\s+(?:example|message))\s*:?\s*$/i;
const ENDORSEMENT = /\b(?:(?:i|we)\s+(?:agree|endorse|approve)|i\s+mean\s+it|do\s+what\s+it\s+says|follow\s+(?:that|these|those)\s+instructions|that\s+is\s+(?:true|correct))\b/i;
const NEGATED_SECRET = /(?<![\p{L}\p{M}\p{N}_])(?:never|do[ \t]+not|don['’]t)[ \t]+((?:send|tell|give|reply[ \t]+with)[ \t]+(?:(?:me|us)[ \t]+)?(?:your[ \t]+)?(?:password|verification[ \t]+code|one[- ]time[ \t]+(?:code|password)|otp|recovery[ \t]+phrase|seed[ \t]+phrase))(?![\p{L}\p{M}\p{N}_])/giu;
const TRAINING = /\btraining[ \t]+(?:slide|example):[ \t]*([^.!?\r\n]{1,240})[.!?][ \t]+do[ \t]+not[ \t]+follow[ \t]+(?:that|this)[ \t]+instruction\b/gi;

export function createEnglishSpamScamAttributionAnalyzer(): TextAnalyzer {
  const baseline = createEnglishSpamScamAnalyzer();
  const descriptor = { ...baseline.descriptor,
    id: 'english-spam-scam-attribution', version: 'spam-scam-attribution-en-v1' };
  Object.freeze(descriptor);
  return { descriptor, async analyze(request: AnalysisRequest): Promise<TextAnalysis> {
    const original = request.content.text;
    const quotes = balancedQuotes(original);
    const excluded: Span[] = [];
    for (const quote of quotes) {
      const prefix = original.slice(Math.max(0, quote.start - 120), quote.start);
      if (FRAME.test(prefix) && !endorsed(original, quote)) excluded.push(quote);
    }
    for (const match of original.matchAll(NEGATED_SECRET)) {
      // Restrict this rule to clause-initial advice outside any parsed quotation.
      // "Do not delay" and "never forget to send" are not negated disclosure.
      if (!/(?:^|[.!?;:\r\n])[ \t]*$/u.test(original.slice(0, match.index))) continue;
      const span = { start: match.index, end: match.index + match[0].length };
      if (quotes.some((quote) => overlaps(quote, span)) || endorsed(original, span)) continue;
      const instruction = match[1]!;
      excluded.push({ start: span.end - instruction.length, end: span.end });
    }
    for (const match of original.matchAll(TRAINING)) {
      const span = { start: match.index, end: match.index + match[0].length };
      if (quotes.some((quote) => overlaps(quote, span)) || endorsed(original, span)) continue;
      const body = match[1]!;
      const start = match.index + match[0].indexOf(body);
      excluded.push({ start, end: start + body.length });
    }
    if (!excluded.length) return baseline.analyze(request);
    // Preserve original UTF-16 positions and prohibit whitespace joining across
    // excluded text. Existing T6A scoring and cue definitions remain untouched.
    const units = original.split('');
    for (const span of excluded) units.fill('\u0000', span.start, span.end);
    const prepared = { ...request, content: { ...request.content, text: units.join('') } };
    const result = await baseline.analyze(prepared);
    if (result.evidence.some((item) => excluded.some((span) => overlaps(item, span)))) {
      return baseline.analyze(request);
    }
    return result;
  } };
}

function endorsed(text: string, span: Span): boolean {
  return ENDORSEMENT.test(text.slice(Math.max(0, span.start - 160), span.start))
    || ENDORSEMENT.test(text.slice(span.end, span.end + 160));
}

function overlaps(left: Span, right: Span): boolean {
  return left.start < right.end && right.start < left.end;
}

function balancedQuotes(text: string): Span[] {
  const spans: Span[] = [];
  let start = -1;
  let closer = '';
  let nested = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index]!;
    if (/[\r\n\u2028\u2029]/u.test(character) || (start >= 0 && index - start - 1 > 512)) {
      start = -1;
      closer = '';
    }
    if (character === '\\') { index++; continue; }
    if (/[‘’']/u.test(character) && /[\p{L}\p{N}]/u.test(text[index - 1] ?? '')
      && /[\p{L}\p{N}]/u.test(text[index + 1] ?? '')) continue;
    if (start >= 0) {
      if (character === closer) {
        if (!nested) spans.push({ start, end: index + 1 });
        start = -1;
        closer = '';
      } else if (PAIRS[character]) nested = true;
    } else if (PAIRS[character]) {
      start = index;
      closer = PAIRS[character]!;
      nested = false;
    }
  }
  return spans;
}
