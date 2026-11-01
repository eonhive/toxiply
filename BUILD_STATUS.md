# Build status

## Phase T3: text intelligence quality foundation — 2026-10-31

Based on merged candidate `449f831`. Baseline `npm ci`, `npm run check` and `npm run eval:all` PASS on Node 22.22.2, including 179 existing tests and all four examples. No baseline failure was observed. Public diagnostic counts and all existing labels remain unchanged.

Added repository-only versioned review datasets, strict provenance/category/review validation, declared held-out reference/overlap checks, immutable private imports, and native-versus-contextual coverage-aware reports. Unsupported/failed/context-incomplete results do not become negatives. Source-boundary checks and optional annotation alignment are separate from semantic correctness. New fixtures are explicitly provisional development/schema probes. No independent human review, collected held-out evaluation or new quality improvement is claimed.

Files: new `AGENTS.md`, three evaluation modules, a development example, two focused test modules, dataset/T3 report docs; reused native-dataset parser/metrics, package scripts, README and canonical docs. The 0.2.0 source, schemas, analyzers, exports, scoring, original datasets, dependencies/lockfile and private/UNLICENSED metadata are unchanged. No Flaggr changes or data access, external model, deployment, visibility change or publishing.

Final `npm ci`, `npm run check`, `npm run eval:all`, focused built-in coverage and package preview all PASS (exit 0). Check passes **219/219** tests, including **40** new regressions; source/example typecheck, build, all four examples and diagnostics execute. New evaluation modules measure 100% line coverage, with branch coverage 98.60% evaluator / 89.74% dataset workflow / 69.23% CLI; this is focused test coverage, not semantic accuracy. Package preview contains 65 files and excludes evaluation datasets/tests and all private reports. The first draft run passed 35/36: one new parent-witness test incorrectly expected a whole-phrase offset; the preserved analyzer returns `hurt` at UTF-16 [10,14). Corrected only that test expectation. [Exact checks, hashes, metrics and remaining gaps](docs/T3_BASELINE.md#verification). Raw evidence is ignored under `.local/t3/`; actual independent review/held-out evaluation, calibration, deployment and publication remain NOT_RUN.

Updated: 2026-10-30 · Phase 2 real text/conversation validation; not integrated, deployed or published.

The current merged base combined the audited native extraction and separate lexical detector, but contained an invalid package script merge and conflicting documentation. This change reconciles package commands/docs, preserves the already-merged V1 contracts and frozen scoring behavior, and replaces whole-field assessment spans with actual category-specific rule witnesses mapped to original UTF-16 source indices.

Implemented: category/context/evidence regression coverage; reproducible public 32-case native diagnostic; the existing 36-case lexical diagnostic in the full suite; and an explicit local frozen-report comparator. Private fixtures/reports remain ignored, with no new private source transfer. Native profanity/spam remain unsupported; lexical profanity presence remains a separate limited algorithm.

Local frozen comparison: 40/40 legacy content and five-category-score matches; zero category/severity differences; four retained quoted-report attribution warnings. Native provisional labels: TP 13/TN 7/FP 5/FN 7 on 32 cases. Legacy provisional labels remain TP 12/TN 10/FP 10/FN 8 on the old 40 cases. Lexical provisional labels remain TP 14/TN 10/FP 0/FN 12 on 36 cases. These are diagnostic findings, not production accuracy.

Validation: clean `npm ci`, `npm run check` (137 tests, source/example typecheck, build, three examples and both public diagnostics), explicit `npm run eval:all`, private frozen-fixture comparison, package-content preview, whitespace and local Markdown links pass locally on Node 22.22.2. CI repeats installation/check/package verification on Node 22 and 24; the final task report records its actual outcome. Source provenance, rights boundary and compatibility method are documented in [PROVENANCE.md](docs/PROVENANCE.md) and [EVALUATION.md](docs/EVALUATION.md).

NOT_RUN: independent human label review, held-out evaluation, calibration, Flaggr workflow/action parity or production integration, media inference, deployment and package publication.

## Attribution quality candidate

Updated: 2026-10-30. Added separate opt-in `contextualTextAnalyzer` / `contextual-attribution-v1`, a bounded report/product attribution helper, example, category/context/endorsement/mixed-abuse regressions, 35-case synthetic challenge and paired comparison tool. The frozen native analyzer, existing diagnostic labels and V1 contracts remain unchanged. No new dependency, external model, private source transfer or platform integration was introduced.

Provisional paired observations: original 32-case diagnostic changes 13 TP/7 TN/5 FP/7 FN to 13 TP/12 TN/0 FP/7 FN; new 35-case challenge changes 19 TP/0 TN/16 FP/0 FN to 19 TP/14 TN/2 FP/0 FN. Both have no new overall false positives, false negatives or category-label regressions. The private 40-case binary comparison fixes three false positives and retains the same positives/misses; native legacy parity remains intact.

Human label review was explicitly deferred by user direction for this PR. The challenge is same-author development evidence, not held-out validation. The candidate remains experimental and opt-in; default analysis and compatibility consumers retain their earlier behavior.

Local validation passes: clean generated build directory, `npm ci`, `npm run check` (179 tests, source/example typecheck, build, four examples and all public diagnostics), explicit `npm run eval:all`, original native frozen legacy comparison, candidate/private binary comparison, package preview and whitespace checks. CI repeats installation/check/package verification on Node 22 and 24; the PR/final report records its actual outcome.
