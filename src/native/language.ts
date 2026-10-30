/**
 * Company: EonHive Inc. | Title: Legacy language preparation
 * Purpose: Preserve pass-through preparation without claiming language detection.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
export interface PrepareMultilingualInputInput {
  text: string;
  language?: string;
}

export interface PrepareMultilingualInputResult {
  preparedText: string;
  normalizedLanguage?: string | undefined;
  modelVersion: string;
  externalEscalationRecommended: boolean;
  reasons: string[];
}

function normalizeLanguage(language?: string): string | undefined {
  return language?.trim().toLowerCase();
}

export function prepareMultilingualInput({
  text,
  language,
}: PrepareMultilingualInputInput): PrepareMultilingualInputResult {
  const normalizedLanguage = normalizeLanguage(language);
  const reasons: string[] = [];
  const externalEscalationRecommended =
    normalizedLanguage !== undefined &&
    normalizedLanguage.length > 0 &&
    !normalizedLanguage.startsWith("en");

  if (externalEscalationRecommended) {
    reasons.push("multilingual:non_english_language_hint");
  }

  return {
    preparedText: text,
    normalizedLanguage,
    modelVersion: "multilingual-router-v1",
    externalEscalationRecommended,
    reasons,
  };
}
