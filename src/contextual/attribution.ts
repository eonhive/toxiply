/**
 * Company: EonHive Inc. | Title: Bounded author attribution heuristics
 * Purpose: Separate narrowly reported quotations and product criticism from author-directed harm.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
export interface AttributedText {
  text: string;
  excluded: Array<{ start: number; end: number; reason: 'reported_quote' | 'product_criticism' }>;
}

const QUOTE_PAIRS: Readonly<Record<string, string>> = { '"': '"', '“': '”', "'": "'", '‘': '’', '`': '`' };
const REPORT_PREFIX = new RegExp('\\b(?:' + [
  '(?:i|we)\\s+(?:have\\s+)?(?:reported|flagged|documented|recorded|received)\\s+(?:(?:the|a|this|that)\\s+)?(?:message|comment|phrase|statement|remark|threat|insult)',
  '(?:he|she|they|someone|the commenter)\\s+(?:said|wrote|posted)',
  '(?:our|the|my)\\s+(?:notes|report|complaint|transcript)\\s+(?:document|record|quote|cite|include)s?(?:\\s+someone\\s+(?:writing|saying))?',
].join('|') + ')\\s*:?\\s*$', 'i');
const REPORT_SUBJECT = /\b(?:the|this|that|a)\s+(?:phrase|message|comment|statement|remark|threat|insult)\s*$/i;
const REPORT_SUFFIX = /^\s*(?:(?:was|is)\s+(?:reported|flagged|documented|recorded|quoted|cited)|appeared\s+in\s+(?:the|a)\s+(?:complaint|report|transcript|notes))\b/i;
const ENDORSEMENT = new RegExp('\\b(?:' + [
  '(?:i|we)\\s+(?:agree|endorse|approve|mean it|meant it|stand by it|will do it)',
  '(?:that|this|it)(?:\\s+(?:is|was)|[\'’]s)\\s+(?:true|right|correct|accurate)',
  '(?:fits|describes|sounds like)\\s+(?:you|them|your)',
  'is\\s+what\\s+you\\s+are|you\\s+deserve\\s+it|well\\s+said|exactly',
].join('|') + ')\\b', 'i');
const OBJECT = '(?:app|application|software|release|update|editor|interface|configuration wizard|design(?: decision)?|feature|service|product|website|tool|documentation|build|game)';
const OBJECT_INSULT = '(?:trash|garbage|stupid|dumb|pathetic|worthless)';
const PREDICATE_CRITICISM = new RegExp(`\\b(?:this|that|the|your|our|my|their)\\s+(?:(?:latest|new|old|current)\\s+)?${OBJECT}\\s+(?:is|was|feels|looks|seems)\\s+(?:(?:really|utterly|absolutely|complete|total)\\s+)*(?:an?\\s+)?(${OBJECT_INSULT})\\b`, 'gi');
const ADJECTIVE_CRITICISM = new RegExp(`\\b(?:an?|the|this|that|your|our|my)\\s+(${OBJECT_INSULT})\\s+${OBJECT}\\b`, 'gi');
const PERSONAL_COMPARISON = /\b(?:like\s+(?:you|him|her|them)|so\s+are\s+you|you(?:'re| are)\b)/i;

export function attributeText(original: string): AttributedText {
  const excluded: AttributedText['excluded'] = [];
  for (const quote of balancedQuotes(original)) {
    const prefix = nearbyClause(original.slice(0, quote.start), 'before');
    const suffix = nearbyClause(original.slice(quote.end), 'after');
    const reported = REPORT_PREFIX.test(prefix) || (REPORT_SUBJECT.test(prefix) && REPORT_SUFFIX.test(suffix));
    if (reported && !ENDORSEMENT.test(prefix) && !ENDORSEMENT.test(suffix)) {
      excluded.push({ ...quote, reason: 'reported_quote' });
    }
  }
  const reportMasked = mask(original, excluded);
  for (const pattern of [PREDICATE_CRITICISM, ADJECTIVE_CRITICISM]) {
    for (const match of reportMasked.matchAll(pattern)) {
      const prefix = nearbyClause(reportMasked.slice(0, match.index), 'before');
      const suffix = nearbyClause(reportMasked.slice(match.index + match[0].length), 'after');
      // A product noun cannot excuse a personal comparison or direct attack.
      if (PERSONAL_COMPARISON.test(prefix) || PERSONAL_COMPARISON.test(suffix)) continue;
      const word = match[1];
      if (word === undefined) continue;
      const start = match.index + match[0].toLowerCase().lastIndexOf(word.toLowerCase());
      excluded.push({ start, end: start + word.length, reason: 'product_criticism' });
    }
  }
  return { text: mask(original, excluded), excluded };
}

function nearbyClause(text: string, side: 'before' | 'after'): string {
  // Decisions stay within one line and a small local window. Sentence endings
  // outside the quotation keep unrelated report/endorsement words out of scope.
  const window = side === 'before' ? text.slice(-160) : text.slice(0, 160);
  if (side === 'before') return window.split(/[.!?\r\n\u2028\u2029]/).at(-1) ?? '';
  return window.replace(/^\s*[.,;:!?]?\s*/, '').split(/[.!?\r\n\u2028\u2029]/)[0] ?? '';
}

function mask(original: string, ranges: ReadonlyArray<{ start: number; end: number }>): string {
  const units = original.split('');
  for (const { start, end } of ranges) {
    // A non-whitespace barrier prevents the scorer joining words across an
    // excluded passage. Replacing UTF-16 units preserves every later offset.
    for (let index = start; index < end; index++) units[index] = '\u0000';
  }
  return units.join('');
}

function balancedQuotes(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let start = -1;
  let closer = '';
  for (let index = 0; index < text.length; index++) {
    const character = text[index] ?? '';
    if (/[\r\n\u2028\u2029]/u.test(character) || (start >= 0 && index - start - 1 > 512)) {
      start = -1;
      closer = '';
    }
    if (character === '\\') {
      index++;
      continue;
    }
    // Apostrophes inside words are not quotation delimiters.
    if ((character === "'" || character === '‘' || character === '’')
      && /[\p{L}\p{N}]/u.test(text[index - 1] ?? '') && /[\p{L}\p{N}]/u.test(text[index + 1] ?? '')) continue;
    if (start >= 0) {
      if (character === closer) {
        ranges.push({ start, end: index + 1 });
        start = -1;
        closer = '';
      }
    } else if (QUOTE_PAIRS[character] !== undefined) {
      start = index;
      closer = QUOTE_PAIRS[character] ?? '';
    }
  }
  return ranges;
}
