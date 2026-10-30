/**
 * Company: EonHive Inc. | Title: Legacy conversation heuristics
 * Purpose: Preserve targeting and escalation from bounded semantic context.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import type { ConversationReplyTarget, ToxiplySignals } from "./types.js";

export interface AnalyzeConversationEvidenceInput {
  text: string;
  parentText?: string;
  quotedText?: string;
  replyTarget?: ConversationReplyTarget;
}

export interface ConversationEvidenceResult {
  targeting: ToxiplySignals["targeting"];
  escalationContribution: number;
  matchedSignals: string[];
}

const SECOND_PERSON_PATTERN = /\b(?:you|you're|youre|your|u|ur)\b/i;
const MENTION_PATTERN = /(^|\s)@\w+/i;
const GROUP_TARGET_PATTERN = /\b(?:you people|your kind|all of you)\b/i;
const SELF_TARGET_PATTERN =
  /\b(?:i(?:'m| am)|im)\s+(?:worthless|trash|garbage|pathetic|broken)\b|\bi should die\b/i;
const CONTINUITY_PATTERN =
  /\b(?:again|still|keep|another word|say that again|one more word)\b/i;
const HOSTILITY_PATTERN =
  /\b(?:idiot|moron|loser|stupid|trash|scum|subhuman|vermin|kill|hurt|shoot|stab|die|watch your back|send me nudes|explicit pics?)\b/i;

function includeSignal(matchedSignals: string[], signal: string): void {
  if (!matchedSignals.includes(signal)) {
    matchedSignals.push(signal);
  }
}

function resolveTargetType({
  replyTarget,
  groupDirected,
  selfDirected,
  directAddressDetected,
}: {
  replyTarget: ConversationReplyTarget | undefined;
  groupDirected: boolean;
  selfDirected: boolean;
  directAddressDetected: boolean;
}): ConversationReplyTarget | undefined {
  if (replyTarget !== undefined) {
    return replyTarget;
  }

  if (groupDirected) {
    return "group";
  }

  if (selfDirected) {
    return "self";
  }

  if (directAddressDetected) {
    return "unknown";
  }

  return undefined;
}

// The conversation lane stays intentionally shallow. It extracts explainable
// targeting and escalation cues that the aggregator can combine with text or
// provider evidence later.
export function analyzeConversationEvidence({
  text,
  parentText,
  quotedText,
  replyTarget,
}: AnalyzeConversationEvidenceInput): ConversationEvidenceResult {
  const normalizedText = text.trim().toLowerCase();
  const normalizedParent = parentText?.trim().toLowerCase();
  const normalizedQuoted = quotedText?.trim().toLowerCase();
  const matchedSignals: string[] = [];
  const secondPersonDirected = SECOND_PERSON_PATTERN.test(normalizedText);
  const mentionDirected = MENTION_PATTERN.test(normalizedText);
  const groupDirected = GROUP_TARGET_PATTERN.test(normalizedText);
  const selfDirected = SELF_TARGET_PATTERN.test(normalizedText);
  const directAddressDetected =
    secondPersonDirected || mentionDirected || groupDirected;
  const targetedByReply = replyTarget !== undefined;
  const isTargeted =
    directAddressDetected || targetedByReply || selfDirected;
  const targetType = resolveTargetType({
    replyTarget,
    groupDirected,
    selfDirected,
    directAddressDetected,
  });
  const hostileCurrent = HOSTILITY_PATTERN.test(normalizedText);
  const hostileParent =
    normalizedParent !== undefined && HOSTILITY_PATTERN.test(normalizedParent);
  const quotedContextPresent = normalizedQuoted !== undefined;

  let escalationContribution = 0;

  if (secondPersonDirected) {
    includeSignal(matchedSignals, "conversation:direct_address:second_person");
  }

  if (mentionDirected) {
    includeSignal(matchedSignals, "conversation:direct_address:mention");
  }

  if (groupDirected) {
    includeSignal(matchedSignals, "conversation:direct_address:group");
  }

  if (selfDirected) {
    includeSignal(matchedSignals, "conversation:self_reference");
  }

  if (parentText) {
    escalationContribution = Math.max(escalationContribution, 0.12);
    includeSignal(matchedSignals, "conversation:reply_context_present");
  }

  if (quotedContextPresent) {
    escalationContribution = Math.max(escalationContribution, 0.16);
    includeSignal(matchedSignals, "conversation:quoted_context_present");
  }

  if (targetedByReply) {
    escalationContribution = Math.max(escalationContribution, 0.18);
    includeSignal(matchedSignals, "conversation:reply_target:present");
  }

  if (isTargeted && CONTINUITY_PATTERN.test(normalizedText)) {
    escalationContribution = Math.max(escalationContribution, 0.36);
    includeSignal(matchedSignals, "conversation:continuity_language");
  }

  if (isTargeted && parentText && hostileCurrent) {
    escalationContribution = Math.max(escalationContribution, 0.28);
    includeSignal(matchedSignals, "conversation:reply_context_hostility");
  }

  if (isTargeted && hostileCurrent && hostileParent) {
    escalationContribution = Math.max(escalationContribution, 0.52);
    includeSignal(matchedSignals, "conversation:continuing_hostility");
  }

  return {
    targeting: {
      isTargeted,
      ...(targetType ? { targetType } : {}),
    },
    escalationContribution,
    matchedSignals,
  };
}
