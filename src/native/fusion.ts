/**
 * Company: EonHive Inc. | Title: Native content evidence fusion
 * Purpose: Combine native content signals without platform policy or providers.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import type { ToxiplySignals } from "./types.js";
import type { ConversationEvidenceResult } from "./conversation.js";
import type { ToxiplyTextLaneResult, ToxiplySubtype } from "./text.js";

export interface AggregateToxiplySignalsInput {
  textResult?: ToxiplyTextLaneResult;
  conversationResult?: ConversationEvidenceResult;
  sourceModalities?: ReadonlyArray<
    NonNullable<ToxiplySignals["sourceModalities"]>[number]
  >;
  routerVersion?: string;
}

function resolveSubtype(
  subtypeCandidates: readonly ToxiplySubtype[],
  scores: ToxiplySignals["scores"],
): ToxiplySubtype {
  const precedence: ToxiplySubtype[] = [
    "explicit_threat",
    "hate_or_slur",
    "sexual_risk",
    "insult",
  ];

  for (const subtype of precedence) {
    if (subtypeCandidates.includes(subtype)) {
      return subtype;
    }
  }

  if (scores.threat >= 0.9) {
    return "explicit_threat";
  }

  if (scores.hate >= 0.82) {
    return "hate_or_slur";
  }

  if (scores.sexualRisk >= 0.8) {
    return "sexual_risk";
  }

  if (scores.harassment >= 0.55 || scores.toxicity >= 0.58) {
    return "insult";
  }

  return "harmless";
}

function scoreSeverity(
  scores: ToxiplySignals["scores"],
  targeting: ToxiplySignals["targeting"],
): ToxiplySignals["severity"] {
  if (scores.threat >= 0.92 && targeting.isTargeted) {
    return "critical";
  }

  if (
    scores.threat >= 0.82 ||
    scores.hate >= 0.82 ||
    scores.sexualRisk >= 0.82 ||
    (scores.harassment >= 0.72 && targeting.isTargeted) ||
    (scores.escalation >= 0.55 && targeting.isTargeted)
  ) {
    return "high";
  }

  if (
    scores.harassment >= 0.55 ||
    scores.toxicity >= 0.6 ||
    scores.escalation >= 0.3 ||
    (scores.harassment >= 0.45 && targeting.isTargeted)
  ) {
    return "medium";
  }

  return "low";
}

function scoreConfidence(
  scores: ToxiplySignals["scores"],
  lexicalSignalCount: number,
  semanticSignalCount: number,
  conversationSignalCount: number,
  targeting?: ToxiplySignals["targeting"],
): ToxiplySignals["confidence"] {
  const totalSignals =
    lexicalSignalCount + semanticSignalCount + conversationSignalCount;
  const corroboratingLayers = [
    lexicalSignalCount > 0,
    semanticSignalCount > 0,
    conversationSignalCount > 0,
  ].filter(Boolean).length;
  const strongestPrimaryScore = Math.max(
    scores.toxicity,
    scores.harassment,
    scores.hate,
    scores.threat,
    scores.sexualRisk,
  );

  if (totalSignals === 0) {
    return "high";
  }

  if (
    scores.threat >= 0.9 ||
    scores.hate >= 0.85 ||
    scores.sexualRisk >= 0.88 ||
    (corroboratingLayers >= 2 && strongestPrimaryScore >= 0.5) ||
    (targeting?.isTargeted === true &&
      conversationSignalCount > 0 &&
      (scores.harassment >= 0.65 ||
        scores.hate >= 0.7 ||
        scores.threat >= 0.75))
  ) {
    return "high";
  }

  // Preserve low confidence for weak targeting/context cues.
  if (
    strongestPrimaryScore === 0 &&
    scores.escalation < 0.3 &&
    totalSignals > 0
  ) {
    return "low";
  }

  if (
    strongestPrimaryScore >= 0.45 ||
    scores.escalation >= 0.3 ||
    totalSignals >= 2
  ) {
    return "medium";
  }

  return "low";
}

function hasReplyContextSignals(conversationSignals: readonly string[]): boolean {
  return conversationSignals.some((signal) =>
    [
      "conversation:reply_context_present",
      "conversation:reply_target:present",
      "conversation:reply_context_hostility",
      "conversation:continuing_hostility",
      "conversation:quoted_context_present",
    ].includes(signal),
  );
}

function hasEscalationSignals(conversationSignals: readonly string[]): boolean {
  return conversationSignals.some((signal) =>
    [
      "conversation:continuity_language",
      "conversation:reply_context_hostility",
      "conversation:continuing_hostility",
    ].includes(signal),
  );
}

function buildSummary(
  subtype: ToxiplySubtype,
  targeting: ToxiplySignals["targeting"],
  conversationSignals: readonly string[],
): string {
  const targeted = targeting.isTargeted;
  const replyContext = hasReplyContextSignals(conversationSignals);
  const escalating = hasEscalationSignals(conversationSignals);

  if (subtype === "explicit_threat") {
    if (targeted && escalating) {
      return "Detected explicit threat language directed at a target within an escalating reply context.";
    }

    if (targeted) {
      return "Detected explicit threat language directed at a target.";
    }

    return replyContext
      ? "Detected explicit threat language with reply-context escalation cues."
      : "Detected explicit threat language.";
  }

  if (subtype === "hate_or_slur") {
    if (targeted && targeting.targetType === "group") {
      return replyContext
        ? "Detected hate or dehumanizing language aimed at a group within a continuing hostile exchange."
        : "Detected hate or dehumanizing language aimed at a group.";
    }

    if (targeted) {
      return replyContext
        ? "Detected hate or dehumanizing language aimed at a target within reply context."
        : "Detected hate or dehumanizing language aimed at a target.";
    }

    return "Detected hate or dehumanizing language cues.";
  }

  if (subtype === "sexual_risk") {
    if (targeted) {
      return replyContext
        ? "Detected targeted sexual-risk solicitation cues in reply context."
        : "Detected targeted sexual-risk solicitation cues.";
    }

    return "Detected sexual-risk solicitation cues.";
  }

  if (subtype === "insult") {
    if (targeted && escalating) {
      return "Detected directed insulting or harassing language in an escalating exchange.";
    }

    if (targeted) {
      return "Detected directed insulting or harassing language.";
    }

    return "Detected insulting or harassing language.";
  }

  return "No high-risk cues detected in current text.";
}

export function aggregateToxiplySignals({
  textResult,
  conversationResult,
  sourceModalities,
  routerVersion,
}: AggregateToxiplySignalsInput): ToxiplySignals {
  const scores: ToxiplySignals["scores"] = {
    toxicity: 0,
    harassment: 0,
    hate: 0,
    threat: 0,
    sexualRisk: 0,
    escalation: 0,
  };

  if (textResult) {
    Object.assign(scores, textResult.scores);
  }

  if (conversationResult) {
    scores.escalation = Math.max(
      scores.escalation,
      conversationResult.escalationContribution,
    );
  }

  const targeting = conversationResult?.targeting ?? {
    isTargeted: false,
  };
  const subtype = resolveSubtype(textResult?.subtypeCandidates ?? [], scores);
  const severity = scoreSeverity(scores, targeting);
  const confidence = scoreConfidence(
    scores,
    textResult?.lexicalSignals.length ?? 0,
    textResult?.semanticSignals.length ?? 0,
    conversationResult?.matchedSignals.length ?? 0,
    targeting,
  );
  const rationaleSignals = [
    ...new Set([
      ...(textResult?.lexicalSignals ?? []),
      ...(textResult?.semanticSignals ?? []),
      ...(conversationResult?.matchedSignals ?? []),
    ]),
  ].sort();
  const baseSummary = buildSummary(
    subtype,
    targeting,
    conversationResult?.matchedSignals ?? [],
  );
  return {
    modelVersions: {
      lexical: textResult?.modelVersions.lexical ?? "lexical-heuristic-v2",
      semantic: textResult?.modelVersions.semantic ?? "semantic-heuristic-v2",
      conversation: "conversation-heuristic-v2",
      aggregator: "toxiply-aggregator-v2",
    },
    scores,
    subtype,
    severity,
    confidence,
    targeting,
    rationale: {
      summary: baseSummary,
      signals:
        rationaleSignals.length > 0
          ? rationaleSignals
          : ["no_high_risk_cues_detected"],
    },
    sourceModalities: sourceModalities?.flatMap((entry) => entry ?? []) ?? [],
    routerVersion,
    aggregatorVersion: "toxiply-aggregator-v2",
    externalUsed: false,
  };
}
