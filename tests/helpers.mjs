/**
 * Company: EonHive Inc. | Title: Synthetic analyzer fixture
 * Purpose: Exercise contracts with fixed signals, never claim classification quality.
 * Author: Stan Nesi | Created: 2026-10-30 | Updated: 2026-10-30
 * Notes: Vibe coded with Codex.
 */
export const request = {
  schemaVersion: 'toxiply.analysis.v1',
  requestId: 'fixture-1',
  content: { kind: 'text', text: 'Synthetic test message.' },
  categories: ['harassment'],
  context: { languageHint: 'en' },
};
export const descriptor = {
  id: 'fixture-only', version: 'fixture-v1',
  categories: ['harassment'], languages: ['en'], supportsContext: false,
};
export const output = {
  findings: [{ category: 'harassment', score: 0.75, evidenceIds: ['e1'] }],
  evidence: [{ id: 'e1', code: 'fixture.synthetic', source: 'text', start: 0, end: 9 }],
};

export function fixtureAnalyzer(overrides = {}) {
  return {
    descriptor: structuredClone(descriptor),
    analyze: () => structuredClone(output),
    ...overrides,
  };
}
