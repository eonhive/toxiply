/**
 * Company: EonHive Inc. | Title: Optional English spam/scam indicators
 * Purpose: Report bounded combinations of suspicious wording with source witnesses.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import type { TextAnalyzer } from '../contracts/analyzer.js';
import type { AnalysisRequest, TextAnalysis, TextAnalyzerDescriptor } from '../contracts/schemas.js';

const WINDOW = 240; // UTF-16 units, measured from the first cue start to last cue end.
const PROMOTION = 'limited[ \\t]+time[ \\t]+offer|exclusive[ \\t]+deal|buy[ \\t]+one[ \\t]+get[ \\t]+one[ \\t]+free|special[ \\t]+discount';

function pattern(body: string): RegExp {
  // Unicode token boundaries avoid matches inside identifiers or decorated words.
  return new RegExp(`(?<![\\p{L}\\p{M}\\p{N}_])(?:${body})(?![\\p{L}\\p{M}\\p{N}_])`, 'giu');
}

// Independently authored finite grammar. No URL, identity or reputation lookup occurs.
const CUES = {
  secret_request: pattern('(?:send|tell|give|reply[ \\t]+with)[ \\t]+(?:(?:me|us)[ \\t]+)?(?:your[ \\t]+)?(?:password|verification[ \\t]+code|one[- ]time[ \\t]+(?:code|password)|otp|recovery[ \\t]+phrase|seed[ \\t]+phrase)'),
  identity_claim: pattern('(?:i[ \\t]+am|this[ \\t]+is|we[ \\t]+are)[ \\t]+(?:your[ \\t]+)?(?:bank|ceo|boss|it[ \\t]+support|customer[ \\t]+support|the[ \\t]+tax[ \\t]+office)'),
  urgency: pattern('act[ \\t]+now|immediately|urgent|within[ \\t]+\\d{1,3}[ \\t]+(?:minutes?|hours?)|do[ \\t]+not[ \\t]+delay|last[ \\t]+chance'),
  prize: pattern('you[ \\t]+(?:have[ \\t]+)?won|you[ \\t]+(?:have[ \\t]+been|were)[ \\t]+selected[ \\t]+(?:as[ \\t]+a[ \\t]+winner|for[ \\t]+a[ \\t]+prize)'),
  fee_request: pattern('(?:pay|send)[ \\t]+(?:(?:a|the)[ \\t]+)?(?:processing|claim|release|delivery)[ \\t]+fee'),
  return_promise: pattern('guaranteed[ \\t]+(?:profit|returns?)|risk[- ]free[ \\t]+investment|double[ \\t]+your[ \\t]+money'),
  money_request: pattern('(?:send|transfer|wire|deposit|invest)[ \\t]+(?:(?:me|us)[ \\t]+)?(?:[$£€]?\\d[\\d,]*|money|funds|bitcoin|crypto(?:currency)?|gift[ \\t]+cards?)|pay[ \\t]+(?:(?:with|using)[ \\t]+)?(?:[$£€]?\\d[\\d,]*|bitcoin|crypto(?:currency)?|gift[ \\t]+cards?)'),
  unusual_payment: pattern('gift[ \\t]+cards?|bitcoin|crypto(?:currency)?'),
  account_risk: pattern('(?:your[ \\t]+)?account[ \\t]+(?:(?:is|has[ \\t]+been|will[ \\t]+be)[ \\t]+)?(?:suspended|locked|deleted|closed)'),
  login_request: pattern('(?:log[ \\t]+in|sign[ \\t]+in)[ \\t]+(?:here|now|at|to[ \\t]+verify)|verify[ \\t]+your[ \\t]+account'),
  unsolicited: pattern('unsolicited|cold[ \\t]+outreach|you[ \\t]+did[ \\t]+not[ \\t]+sign[ \\t]+up'),
  promotion: pattern(PROMOTION),
  call_to_action: pattern('buy[ \\t]+now|order[ \\t]+now|click[ \\t]+here|contact[ \\t]+me|dm[ \\t]+me'),
};
type Cue = keyof typeof CUES;
type Match = { cue: Cue; start: number; end: number; text: string };
type Rule = { code: string; score: number; cues: readonly Cue[] };

const RULES: readonly Rule[] = [
  { code: 'credential_impersonation', score: 0.95, cues: ['secret_request', 'identity_claim'] },
  { code: 'credential_pressure', score: 0.9, cues: ['secret_request', 'urgency'] },
  { code: 'prize_fee', score: 0.9, cues: ['prize', 'fee_request'] },
  { code: 'prize_credentials', score: 0.95, cues: ['prize', 'secret_request'] },
  { code: 'financial_solicitation', score: 0.9, cues: ['return_promise', 'money_request'] },
  { code: 'payment_pressure', score: 0.85, cues: ['money_request', 'unusual_payment', 'urgency'] },
  { code: 'payment_impersonation', score: 0.9, cues: ['money_request', 'unusual_payment', 'identity_claim'] },
  { code: 'phishing_login', score: 0.9, cues: ['account_risk', 'login_request', 'urgency'] },
  { code: 'unsolicited_promotion', score: 0.65, cues: ['unsolicited', 'promotion', 'call_to_action'] },
];

export function createEnglishSpamScamAnalyzer(): TextAnalyzer {
  const descriptor: TextAnalyzerDescriptor = {
    id: 'english-spam-scam', version: 'spam-scam-en-v1',
    categories: ['spam_scam'], languages: ['en'], supportsContext: false,
  };
  Object.freeze(descriptor.categories);
  Object.freeze(descriptor.languages);
  Object.freeze(descriptor);
  return { descriptor, analyze: analyzeSpamScam };
}

function analyzeSpamScam(request: AnalysisRequest): TextAnalysis {
  const matches: Match[] = [];
  for (const cue of Object.keys(CUES) as Cue[]) {
    for (const match of request.content.text.matchAll(CUES[cue])) {
      matches.push({ cue, start: match.index, end: match.index + match[0].length, text: match[0] });
    }
  }
  matches.sort((left, right) => left.start - right.start || left.end - right.end);
  const evidence: TextAnalysis['evidence'] = [];
  let score = 0;
  for (const rule of RULES) {
    const witnesses = findWitnesses(matches.filter((match) => rule.cues.includes(match.cue)), rule.cues);
    if (witnesses.length === 0) continue;
    score = Math.max(score, rule.score);
    appendEvidence(evidence, rule.code, witnesses);
  }

  // Require three occurrences of the same promotional phrase and a local action.
  // Different offers, one ordinary discount, and repetition without solicitation do not qualify.
  for (const phrase of new Set(matches.filter((match) => match.cue === 'promotion').map(promotionKey))) {
    const relevant = matches.filter((match) => match.cue === 'call_to_action'
      || (match.cue === 'promotion' && promotionKey(match) === phrase));
    const witnesses = findWitnesses(relevant, ['promotion', 'call_to_action'], 3);
    if (!witnesses.length) continue;
    score = Math.max(score, 0.7);
    appendEvidence(evidence, 'repeated_promotion', witnesses);
    break; // One bounded witness set, not an exhaustive repetition count.
  }
  return { findings: [{ category: 'spam_scam', score, evidenceIds: evidence.map((item) => item.id) }], evidence };
}

function promotionKey(match: Match): string {
  return match.text.toLowerCase().replace(/[ \t]+/g, ' ');
}

function findWitnesses(matches: Match[], cues: readonly Cue[], repetitions = 1): Match[] {
  for (let first = 0; first < matches.length; first++) {
    const anchor = matches[first]!;
    const witnesses: Match[] = [];
    for (let next = first; next < matches.length; next++) {
      const match = matches[next]!;
      // Starts are sorted, but a long earlier match need not fit this window.
      if (match.start >= anchor.start + WINDOW) break;
      if (match.end > anchor.start + WINDOW) continue;
      const required = match.cue === 'promotion' ? repetitions : 1;
      if (witnesses.filter((item) => item.cue === match.cue).length < required) witnesses.push(match);
      if (cues.every((cue) => witnesses.filter((item) => item.cue === cue).length
        >= (cue === 'promotion' ? repetitions : 1))) return witnesses;
    }
  }
  return [];
}

function appendEvidence(evidence: TextAnalysis['evidence'], rule: string, witnesses: Match[]): void {
  for (const match of witnesses) {
    evidence.push({ id: `spam-${evidence.length + 1}`, code: `spam_scam.${rule}.${match.cue}`,
      source: 'text', start: match.start, end: match.end });
  }
}
