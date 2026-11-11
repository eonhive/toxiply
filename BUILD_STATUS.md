# Build status

## Phase T6A: optional content-level spam/scam — 2026-11-11

Base: T5 `a7fef7f`. Before edits, `npm ci`, `npm run check` and explicit
`npm run eval:all` PASS (exit 0) on Node 22.22.2 / npm 10.9.7, with 249/249 tests,
four examples and existing public diagnostics. No baseline failure was observed.

Added only the opt-in `createEnglishSpamScamAnalyzer()` / `spam-scam-en-v1`, finite
multi-cue current-text rules, original UTF-16 witnesses, usage example, regressions and
a separately versioned 48-case synthetic development diagnostic. Exact `en` is required;
semantic context is unsupported. V1 contracts, existing native/contextual/lexical
analyzers, default unsupported behavior, dependencies and private/UNLICENSED metadata
remain unchanged. No Flaggr access/modification, network lookup, service or persistence.

Provisional diagnostic: 15 TP / 23 TN / 5 FP / 5 FN; 48 completed; 51 source witnesses,
0 invalid. Native is unsupported on all 48: no assessed baseline or paired accuracy
improvement. Warnings, quotes and satire remain known FPs; lexical/evasion/companion-cue
gaps remain FNs. No labels were tuned. [Exact semantics, hash, group report and T6B
proposal](docs/ENGLISH_SPAM_SCAM.md) distinguish development findings from independent
review. T5's missing independent corpus/reviewer/rights/freeze records remain missing.

Focused new tests PASS 28/28 (exit 0). The first 23-test run passed 22: its maximum-input
test expected trailing punctuation inside the secret-request span. Corrected only the
test fixture to end at the matched phrase; implementation and diagnostic labels unchanged.
Final `npm ci`, `npm run check`, explicit `npm run eval:all` and
`npm pack --dry-run --json` PASS (exit 0). Check passes 277/277 tests, typecheck/build,
five examples and all public diagnostics. Focused new tests with Node coverage PASS
28/28: the new analyzer has 100% lines/functions and 97.62% branches; this is test
coverage, not accuracy. Package inspection PASS: 69 files (four generated files for
the new module), no evaluation datasets/tests/private artifacts. All four existing
lexical/native/paired/review JSON reports are byte-identical to their saved baselines.
Frozen modules/schemas/datasets/lockfile have no diff; whitespace and updated local
documentation targets PASS. Local verification uses Node 22.22.2 / npm 10.9.7;
CI's Node 22/24 outcome is recorded on the PR separately.

The concurrent 44-case draft caused three hash/count assertions to fail during an
intermediate coverage run. The user selected this chat's original 48-case version;
its original hash and labels were restored, and final focused/full checks above pass.
The other draft and raw logs remain ignored under `.local/t6a/`.
Independent human review, held-out evaluation, calibration,
private legacy rerun, Flaggr integration, deployment and publication remain NOT_RUN.

## Phase T5: independent validation readiness — 2026-11-01

Based on merged T4 `ba8d08b`. `npm ci`, `npm run check` and explicit `npm run eval:all`
PASS (exit 0) on Node 22.22.2 / npm 10.9.7: 249/249 tests, typecheck/build, four examples
and all public evaluations. Existing review regressions PASS 70/70; focused evaluator/
dataset/packet/CLI coverage is 100% lines, 95.79% branches, 98.91% functions combined,
not full-library coverage or accuracy. Public paired output is byte-identical to T4;
package preview remains 65 files. No code, labels, schemas, dependencies or tests change.

[T5 report](docs/T5_VALIDATION_READINESS.md) audits existing tools, defines private
corpus/reviewer/rights/freeze/reference onboarding and records exact missing inputs.
No approved data or independent reviewer records were supplied; reviewed import,
independent/held-out comparison and calibration are NOT_RUN. Existing synthetic results
remain provisional and separate. One unquoted victim-report attribution experiment is
proposed from measured development errors, not implemented. Native and opt-in contextual
behavior, V1 contracts and Flaggr remain unchanged. Local evidence is ignored in `.local/t5/`.
Stop at the focused preparation PR; no automatic merge, release or production changes.

## Phase T4: offline annotation handoff — 2026-11-01

Based on merged Phase T3 `49ada64`. Baseline `npm ci` and `npm run check` PASS on
Node 22.22.2 / npm 10.9.7, including 219 tests, typecheck/build, all four examples and
the full public evaluation suite. The user chose to build review tools while keeping
labels provisional; no approved corpus or independent reviewer was supplied.

Added prediction-free opaque-ID packets, blank response templates, source/packet hash
validation and submitted-label reconciliation into new immutable private versions.
Original split, source/context, provenance, labels/data files, 0.2.0 library, analyzers,
contracts, dependencies and default behavior remain unchanged. Audit receipts preserve
lineage and label deltas; metadata cannot prove actual review. Draft annotation guidance
requires owner/reviewer agreement. [Exact T4 validation and remaining gates](docs/T4_REVIEW_WORKFLOW.md)
are recorded separately; actual independent review/held-out evaluation remain NOT_RUN.

Final `npm ci`, `npm run check`, `npm run eval:all`, focused coverage and package
preview PASS (exit 0). Check passes 249/249 tests, including 30 new regressions. The
56-test focused run covers the new packet module at 100% lines/branches/functions;
the reused dataset/CLI branches measure 93.26%/69.23%. The public paired report is
byte-identical to T3; package preview still has 65 files with no evaluation/private
artifacts. CLI smoke checks create only a packet/blank template and reject unfilled
review. Logs/reports remain ignored under `.local/t4/`; no real annotation is claimed.

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
