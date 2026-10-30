/**
 * Company: EonHive Inc. | Title: Native content types
 * Purpose: Keep extracted content evidence independent of platform contracts.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
export type ConversationReplyTarget = 'parent_author' | 'group' | 'self' | 'unknown';

export interface NativeInput {
  text: string;
  parentText?: string;
  quotedText?: string;
  replyTarget?: ConversationReplyTarget;
  language?: string;
}

// Internal compatibility evidence; never includes tenant policy or actions.
export interface ToxiplySignals {
  modelVersions: {
    lexical: string;
    semantic: string;
    conversation: string;
    aggregator: string;
  };
  scores: {
    toxicity: number;
    harassment: number;
    hate: number;
    threat: number;
    sexualRisk: number;
    escalation: number;
  };
  subtype?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: 'low' | 'medium' | 'high';
  targeting: { isTargeted: boolean; targetType?: ConversationReplyTarget };
  rationale: { summary: string; signals: string[] };
  sourceModalities: Array<'text' | 'conversation' | 'multilingual'>;
  routerVersion?: string | undefined;
  aggregatorVersion: string;
  externalUsed: boolean;
}
