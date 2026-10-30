/**
 * Company: EonHive Inc. | Title: Legacy native text heuristics
 * Purpose: Preserve the extracted deterministic lexical and semantic scoring.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import type { ConversationReplyTarget, ToxiplySignals } from "./types.js";

export type ToxiplySubtype =
  | "explicit_threat"
  | "hate_or_slur"
  | "sexual_risk"
  | "insult"
  | "harmless";

export interface AnalyzeNativeTextInput {
  text: string;
  parentText?: string;
  replyTarget?: ConversationReplyTarget;
}

export interface ToxiplyTextLaneResult {
  modelVersions: {
    lexical: string;
    semantic: string;
  };
  scores: ToxiplySignals["scores"];
  lexicalSignals: string[];
  semanticSignals: string[];
  subtypeCandidates: ToxiplySubtype[];
}

interface PatternRule {
  pattern: RegExp;
  signal: string;
}

const EMPTY_SCORES: ToxiplySignals["scores"] = {
  toxicity: 0,
  harassment: 0,
  hate: 0,
  threat: 0,
  sexualRisk: 0,
  escalation: 0,
};

const INSULT_TERMS = [
  "idiot",
  "moron",
  "loser",
  "stupid",
  "dumb",
  "clown",
  "pathetic",
  "trash",
  "garbage",
  "scum",
  "worthless",
];

const DIRECT_ADDRESS_PATTERNS: PatternRule[] = [
  {
    pattern: /\b(?:you|you're|youre|your|u|ur)\b/i,
    signal: "lexical:targeting:second_person",
  },
  {
    pattern: /(^|\s)@\w+/i,
    signal: "lexical:targeting:mention",
  },
];

const THREAT_PATTERNS: PatternRule[] = [
  {
    pattern:
      /\b(?:i(?:'ll| will| am going to| gonna)|we(?:'ll| will))\s+(?:fucking\s+)?(?:kill|hurt|shoot|stab|beat|find|hunt|destroy|ruin)\s+you\b/i,
    signal: "lexical:threat:direct_violence",
  },
  {
    pattern: /\byou should die\b/i,
    signal: "lexical:threat:death_wish",
  },
  {
    pattern: /\byou(?:'re| are)\s+dead\b/i,
    signal: "lexical:threat:you_are_dead",
  },
  {
    pattern: /\bwatch your back\b/i,
    signal: "lexical:threat:watch_your_back",
  },
  {
    pattern: /\bone more word\b/i,
    signal: "lexical:threat:continued_confrontation_warning",
  },
];

const HATE_PATTERNS: PatternRule[] = [
  {
    pattern: /\b(?:subhuman|vermin|filth|animals?)\b/i,
    signal: "lexical:hate:dehumanization",
  },
  {
    pattern: /\bgo back to your country\b/i,
    signal: "lexical:hate:xenophobic_exclusion",
  },
  {
    pattern: /\byour kind\b/i,
    signal: "lexical:hate:group_othering",
  },
  {
    pattern: /\b(?:faggot|tranny)\b/i,
    signal: "lexical:hate:anti_lgbtq_slur",
  },
  {
    pattern: /\bkike\b/i,
    signal: "lexical:hate:antisemitic_slur",
  },
  {
    pattern: /\bchink\b/i,
    signal: "lexical:hate:anti_asian_slur",
  },
  {
    pattern: /\b(?:nigger|nigga?)\b/i,
    signal: "lexical:hate:anti_african_american_slur",
  },
];

const SEXUAL_RISK_PATTERNS: PatternRule[] = [
  {
    pattern: /\bsend (?:me\s+)?nudes?\b/i,
    signal: "lexical:sexual_risk:nudes_request",
  },
  {
    pattern: /\bsend (?:me\s+)?(?:sexy|explicit)\s+pics?\b/i,
    signal: "lexical:sexual_risk:explicit_pics_request",
  },
  {
    pattern: /\bshow me (?:your|ur)\s+(?:body|boobs|tits|ass)\b/i,
    signal: "lexical:sexual_risk:sexualized_body_request",
  },
  {
    pattern: /\b(?:dick pics?|nude photos?)\b/i,
    signal: "lexical:sexual_risk:nude_image_request",
  },
];

const SEMANTIC_INSULT_PATTERNS: PatternRule[] = [
  {
    pattern:
      /\byou(?:'re| are| sound like)\s+(?:such\s+(?:an?\s+)?)?(?:idiot|moron|loser|stupid|dumb|clown|pathetic|trash|garbage|scum|worthless)\b/i,
    signal: "semantic:insult:direct_name_calling",
  },
  {
    pattern: /\bshut up\b/i,
    signal: "semantic:insult:shut_up",
  },
  {
    pattern: /\bnobody wants you here\b/i,
    signal: "semantic:insult:rejection",
  },
];

const SEMANTIC_THREAT_PATTERNS: PatternRule[] = [
  {
    pattern:
      /\b(?:i(?:'ll| will| am going to| gonna)|we(?:'ll| will))\s+(?:fucking\s+)?(?:kill|hurt|shoot|stab|beat|find|hunt|destroy|ruin)\s+you\b/i,
    signal: "semantic:threat:intent_to_harm",
  },
  {
    pattern: /\byou should die\b/i,
    signal: "semantic:threat:death_wish",
  },
  {
    pattern: /\bwatch your back\b/i,
    signal: "semantic:threat:retaliation_warning",
  },
  {
    pattern: /\b(?:one more word|say that again)\b/i,
    signal: "semantic:threat:escalating_warning",
  },
];

const CONTEXTUAL_THREAT_PATTERNS: PatternRule[] = [
  {
    pattern:
      /\b(?:keep talking(?: and see what happens)?|do it again(?: and see what happens)?|see what happens|you(?:'ll| will) regret it|try me)\b/i,
    signal: "semantic:threat:contextual_retaliation_warning",
  },
];

const SEMANTIC_HATE_PATTERNS: PatternRule[] = [
  {
    pattern: /\b(?:you people|your kind)\b/i,
    signal: "semantic:hate:group_targeting",
  },
  {
    pattern: /\b(?:subhuman|vermin|filth|animals?)\b/i,
    signal: "semantic:hate:group_dehumanization",
  },
  {
    pattern: /\bgo back to your country\b/i,
    signal: "semantic:hate:exclusionary_language",
  },
  {
    pattern: /\b(?:faggot|tranny|kike|chink)\b/i,
    signal: "semantic:hate:slur_usage",
  },
];

const SEMANTIC_SEXUAL_PATTERNS: PatternRule[] = [
  {
    pattern: /\bsend (?:me\s+)?(?:nudes?|sexy pics?|explicit pics?)\b/i,
    signal: "semantic:sexual_risk:coercive_request",
  },
  {
    pattern: /\bshow me (?:your|ur)\s+(?:body|boobs|tits|ass)\b/i,
    signal: "semantic:sexual_risk:body_image_request",
  },
  {
    pattern: /\blet me see you naked\b/i,
    signal: "semantic:sexual_risk:nudity_request",
  },
];

const QUOTED_HARASSMENT_PATTERNS: PatternRule[] = [
  {
    pattern:
      /["“'`](?:[^"'`]{0,24})?(?:idiot|moron|loser|stupid|dumb|clown|pathetic|trash|garbage|scum|worthless)(?:[^"'`]{0,24})?["”'`]\s+(?:fits|describes|is|sounds like)\b/i,
    signal: "semantic:harassment:quoted_insult_affirmation",
  },
];

const SARCASM_PATTERNS: PatternRule[] = [
  {
    pattern:
      /\b(?:sure|yeah right|right|wow|nice)\b[\s,!.\-:;]*(?:you(?:'re| are)\s+)?(?:a\s+)?(?:real\s+)?(?:genius|hero|champ|buddy)\b/i,
    signal: "semantic:harassment:sarcastic_dismissal",
  },
  {
    pattern: /\bwhat a (?:genius|hero|champ)\b/i,
    signal: "semantic:harassment:sarcastic_dismissal",
  },
];

const SECOND_PERSON_PATTERN = /\b(?:you|you're|youre|your|u|ur)\b/i;
const HOSTILITY_PATTERN =
  /\b(?:idiot|moron|loser|stupid|trash|scum|subhuman|vermin|kill|hurt|shoot|stab|die|watch your back)\b/i;

function includeSignal(matchedSignals: string[], signal: string): void {
  if (!matchedSignals.includes(signal)) {
    matchedSignals.push(signal);
  }
}

function includeSubtype(
  subtypeCandidates: ToxiplySubtype[],
  subtype: ToxiplySubtype,
): void {
  if (!subtypeCandidates.includes(subtype)) {
    subtypeCandidates.push(subtype);
  }
}

function anyPatternMatched(
  rules: readonly PatternRule[],
  normalizedText: string,
  matchedSignals: string[],
): boolean {
  let matched = false;

  for (const rule of rules) {
    if (!rule.pattern.test(normalizedText)) {
      continue;
    }

    matched = true;
    includeSignal(matchedSignals, rule.signal);
  }

  return matched;
}

function mergeScores(
  currentScores: ToxiplySignals["scores"],
  nextScores: ToxiplySignals["scores"],
): void {
  currentScores.toxicity = Math.max(currentScores.toxicity, nextScores.toxicity);
  currentScores.harassment = Math.max(
    currentScores.harassment,
    nextScores.harassment,
  );
  currentScores.hate = Math.max(currentScores.hate, nextScores.hate);
  currentScores.threat = Math.max(currentScores.threat, nextScores.threat);
  currentScores.sexualRisk = Math.max(
    currentScores.sexualRisk,
    nextScores.sexualRisk,
  );
  currentScores.escalation = Math.max(
    currentScores.escalation,
    nextScores.escalation,
  );
}

function detectLexicalSignals(text: string): {
  scores: ToxiplySignals["scores"];
  matchedSignals: string[];
  subtypeCandidates: ToxiplySubtype[];
} {
  const normalizedText = text.trim().toLowerCase();
  const scores = { ...EMPTY_SCORES };
  const matchedSignals: string[] = [];
  const subtypeCandidates: ToxiplySubtype[] = [];
  const targetedByLexicalCue = anyPatternMatched(
    DIRECT_ADDRESS_PATTERNS,
    normalizedText,
    matchedSignals,
  );
  let harmfulCueMatched = false;

  for (const insultTerm of INSULT_TERMS) {
    if (new RegExp(`\\b${insultTerm}\\b`, "i").test(normalizedText)) {
      harmfulCueMatched = true;
      scores.toxicity = Math.max(scores.toxicity, 0.58);
      scores.harassment = Math.max(
        scores.harassment,
        targetedByLexicalCue ? 0.62 : 0.52,
      );
      includeSignal(matchedSignals, `lexical:insult:${insultTerm}`);
      includeSubtype(subtypeCandidates, "insult");
    }
  }

  if (anyPatternMatched(THREAT_PATTERNS, normalizedText, matchedSignals)) {
    harmfulCueMatched = true;
    scores.threat = Math.max(scores.threat, 0.96);
    scores.toxicity = Math.max(scores.toxicity, 0.78);
    scores.harassment = Math.max(scores.harassment, 0.76);
    scores.escalation = Math.max(
      scores.escalation,
      targetedByLexicalCue ? 0.72 : 0.62,
    );
    includeSubtype(subtypeCandidates, "explicit_threat");
  }

  if (anyPatternMatched(HATE_PATTERNS, normalizedText, matchedSignals)) {
    harmfulCueMatched = true;
    scores.hate = Math.max(scores.hate, 0.88);
    scores.harassment = Math.max(scores.harassment, 0.72);
    scores.toxicity = Math.max(scores.toxicity, 0.78);
    scores.escalation = Math.max(
      scores.escalation,
      targetedByLexicalCue ? 0.38 : 0.22,
    );
    includeSubtype(subtypeCandidates, "hate_or_slur");
  }

  if (anyPatternMatched(SEXUAL_RISK_PATTERNS, normalizedText, matchedSignals)) {
    harmfulCueMatched = true;
    scores.sexualRisk = Math.max(scores.sexualRisk, 0.83);
    scores.toxicity = Math.max(scores.toxicity, 0.32);
    scores.harassment = Math.max(
      scores.harassment,
      targetedByLexicalCue ? 0.5 : 0.36,
    );
    includeSubtype(subtypeCandidates, "sexual_risk");
  }

  if (targetedByLexicalCue && harmfulCueMatched) {
    scores.escalation = Math.max(scores.escalation, 0.18);
  }

  return {
    scores,
    matchedSignals,
    subtypeCandidates,
  };
}

function analyzeSemanticSignals({
  text,
  parentText,
  replyTarget,
}: AnalyzeNativeTextInput): {
  scores: ToxiplySignals["scores"];
  matchedSignals: string[];
  subtypeCandidates: ToxiplySubtype[];
} {
  const normalizedText = text.trim().toLowerCase();
  const normalizedParent = parentText?.trim().toLowerCase();
  const scores = { ...EMPTY_SCORES };
  const matchedSignals: string[] = [];
  const subtypeCandidates: ToxiplySubtype[] = [];
  const directAddressDetected = SECOND_PERSON_PATTERN.test(normalizedText);
  const contextualReply = Boolean(parentText || replyTarget);
  const hostileParent =
    normalizedParent !== undefined && HOSTILITY_PATTERN.test(normalizedParent);

  if (anyPatternMatched(SEMANTIC_INSULT_PATTERNS, normalizedText, matchedSignals)) {
    scores.toxicity = Math.max(scores.toxicity, 0.68);
    scores.harassment = Math.max(
      scores.harassment,
      directAddressDetected ? 0.66 : 0.54,
    );
    if (directAddressDetected) {
      scores.escalation = Math.max(scores.escalation, 0.16);
    }
    includeSubtype(subtypeCandidates, "insult");
  }

  if (anyPatternMatched(SEMANTIC_THREAT_PATTERNS, normalizedText, matchedSignals)) {
    scores.threat = Math.max(scores.threat, 0.98);
    scores.toxicity = Math.max(scores.toxicity, 0.82);
    scores.harassment = Math.max(scores.harassment, 0.78);
    scores.escalation = Math.max(
      scores.escalation,
      directAddressDetected || contextualReply ? 0.8 : 0.68,
    );
    includeSubtype(subtypeCandidates, "explicit_threat");
  }

  if (
    normalizedParent !== undefined &&
    hostileParent &&
    anyPatternMatched(CONTEXTUAL_THREAT_PATTERNS, normalizedText, matchedSignals)
  ) {
    scores.threat = Math.max(scores.threat, 0.94);
    scores.toxicity = Math.max(scores.toxicity, 0.78);
    scores.harassment = Math.max(scores.harassment, 0.74);
    scores.escalation = Math.max(scores.escalation, 0.86);
    includeSubtype(subtypeCandidates, "explicit_threat");
  }

  if (anyPatternMatched(SEMANTIC_HATE_PATTERNS, normalizedText, matchedSignals)) {
    scores.hate = Math.max(scores.hate, 0.91);
    scores.harassment = Math.max(scores.harassment, 0.74);
    scores.toxicity = Math.max(scores.toxicity, 0.78);
    scores.escalation = Math.max(
      scores.escalation,
      directAddressDetected || contextualReply ? 0.4 : 0.24,
    );
    includeSubtype(subtypeCandidates, "hate_or_slur");
  }

  if (anyPatternMatched(SEMANTIC_SEXUAL_PATTERNS, normalizedText, matchedSignals)) {
    scores.sexualRisk = Math.max(scores.sexualRisk, 0.86);
    scores.toxicity = Math.max(scores.toxicity, 0.34);
    scores.harassment = Math.max(
      scores.harassment,
      directAddressDetected ? 0.56 : 0.38,
    );
    if (directAddressDetected || contextualReply) {
      scores.escalation = Math.max(scores.escalation, 0.18);
    }
    includeSubtype(subtypeCandidates, "sexual_risk");
  }

  if (
    contextualReply &&
    anyPatternMatched(QUOTED_HARASSMENT_PATTERNS, normalizedText, matchedSignals)
  ) {
    scores.toxicity = Math.max(scores.toxicity, 0.62);
    scores.harassment = Math.max(scores.harassment, 0.64);
    scores.escalation = Math.max(
      scores.escalation,
      hostileParent ? 0.34 : 0.22,
    );
    includeSubtype(subtypeCandidates, "insult");
  }

  if (
    contextualReply &&
    anyPatternMatched(SARCASM_PATTERNS, normalizedText, matchedSignals)
  ) {
    scores.toxicity = Math.max(scores.toxicity, 0.58);
    scores.harassment = Math.max(scores.harassment, 0.6);
    scores.escalation = Math.max(
      scores.escalation,
      hostileParent ? 0.28 : 0.16,
    );
    includeSubtype(subtypeCandidates, "insult");
  }

  return {
    scores,
    matchedSignals,
    subtypeCandidates,
  };
}

export function analyzeNativeText(
  input: AnalyzeNativeTextInput,
): ToxiplyTextLaneResult {
  const lexicalSignals = detectLexicalSignals(input.text);
  const semanticSignals = analyzeSemanticSignals(input);
  const scores = { ...EMPTY_SCORES };

  mergeScores(scores, lexicalSignals.scores);
  mergeScores(scores, semanticSignals.scores);

  return {
    modelVersions: {
      lexical: "lexical-heuristic-v2",
      semantic: "semantic-heuristic-v2",
    },
    scores,
    lexicalSignals: lexicalSignals.matchedSignals,
    semanticSignals: semanticSignals.matchedSignals,
    subtypeCandidates: [...new Set([
      ...lexicalSignals.subtypeCandidates,
      ...semanticSignals.subtypeCandidates,
    ])],
  };
}
