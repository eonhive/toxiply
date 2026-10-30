/**
 * Company: EonHive Inc. | Title: Native content assessment
 * Purpose: Compose the frozen native text and bounded conversation behavior.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
import { analyzeConversationEvidence } from './conversation.js';
import { aggregateToxiplySignals } from './fusion.js';
import { prepareMultilingualInput } from './language.js';
import { analyzeNativeText } from './text.js';
import type { NativeInput, ToxiplySignals } from './types.js';

export function analyzeNativeContent(input: NativeInput): ToxiplySignals {
  const prepared = prepareMultilingualInput({
    text: input.text,
    ...(input.language === undefined ? {} : { language: input.language }),
  });
  const context = {
    ...(input.parentText === undefined ? {} : { parentText: input.parentText }),
    ...(input.quotedText === undefined ? {} : { quotedText: input.quotedText }),
    ...(input.replyTarget === undefined ? {} : { replyTarget: input.replyTarget }),
  };
  const laneInput = { text: prepared.preparedText, ...context };
  const sourceModalities: ToxiplySignals['sourceModalities'] = ['text'];
  if (Object.keys(context).length > 0) sourceModalities.push('conversation');
  if (prepared.externalEscalationRecommended) sourceModalities.push('multilingual');

  // Direct-address cues are assessed even without an explicit parent message.
  return aggregateToxiplySignals({
    textResult: analyzeNativeText(laneInput),
    conversationResult: analyzeConversationEvidence(laneInput),
    sourceModalities,
    routerVersion: 'native-content-heuristic-v2',
  });
}
