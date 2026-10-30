# Build status

Updated: 2026-10-30 · Phase 2 real text/conversation validation; not integrated, deployed or published.

The current merged base combined the audited native extraction and separate lexical detector, but contained an invalid package script merge and conflicting documentation. This change reconciles package commands/docs, preserves the already-merged V1 contracts and frozen scoring behavior, and replaces whole-field assessment spans with actual category-specific rule witnesses mapped to original UTF-16 source indices.

Implemented: category/context/evidence regression coverage; reproducible public 32-case native diagnostic; the existing 36-case lexical diagnostic in the full suite; and an explicit local frozen-report comparator. Private fixtures/reports remain ignored, with no new private source transfer. Native profanity/spam remain unsupported; lexical profanity presence remains a separate limited algorithm.

Local frozen comparison: 40/40 legacy content and five-category-score matches; zero category/severity differences; four retained quoted-report attribution warnings. Native provisional labels: TP 13/TN 7/FP 5/FN 7 on 32 cases. Legacy provisional labels remain TP 12/TN 10/FP 10/FN 8 on the old 40 cases. Lexical provisional labels remain TP 14/TN 10/FP 0/FN 12 on 36 cases. These are diagnostic findings, not production accuracy.

Validation: clean `npm ci`, `npm run check` (137 tests, source/example typecheck, build, three examples and both public diagnostics), explicit `npm run eval:all`, private frozen-fixture comparison, package-content preview, whitespace and local Markdown links pass locally on Node 22.22.2. CI repeats installation/check/package verification on Node 22 and 24; the final task report records its actual outcome. Source provenance, rights boundary and compatibility method are documented in [PROVENANCE.md](docs/PROVENANCE.md) and [EVALUATION.md](docs/EVALUATION.md).

NOT_RUN: independent human label review, held-out evaluation, calibration, Flaggr workflow/action parity or production integration, media inference, deployment and package publication.
