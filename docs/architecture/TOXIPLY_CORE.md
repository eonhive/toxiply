# Independent Toxiply core

Updated: 2026-11-11 · Status: Phase 2 text engine; T3–T5 evaluation; T6A optional spam/scam

## Boundary and execution

One TypeScript library runs in process with no Flaggr runtime imports, database, additional server, Python, or required model/provider. Applications own persistent history, tenant policy, review, routing and actions. Zod is the only runtime dependency. No Flaggr production integration is performed here.

`analyze()` remains unconfigured. `createAnalyzer(nativeTextAnalyzer)` selects the already-audited text/conversation/language/fusion extraction. A separate `createEnglishProfanityAnalyzer()` supplies narrowly specified lexical presence, without implying that the native analyzer supports profanity. Custom analyzers use the same local interface.

`createAnalyzer(contextualTextAnalyzer)` selects a separately versioned attribution experiment. `src/contextual/attribution.ts` recognizes narrow reporting/product syntax and produces a length-preserving working copy for the frozen scoring rules. `src/contextual-text-analyzer.ts` checks returned witnesses against excluded ranges and falls back to the baseline for an artificial cross-mask match. Original input and the existing native algorithm remain unchanged. This candidate does not provide new categories, language support, calibrated confidence or a new public schema. See [its bounded grammar and limitations](../CONTEXTUAL_ATTRIBUTION.md).

T6A adds `createAnalyzer(createEnglishSpamScamAnalyzer())` as another optional single
adapter. `src/text/english-spam-scam.ts` matches finite current-text cue combinations
within 240 UTF-16 units and returns original contributing spans. Only `spam_scam`
and exact `en` are supported; absent `languageHint` stays unsupported `und`.
`supportsContext: false` invokes existing context stripping/partial coverage. No combined
registry, orchestration, network provider, persistence or application-owned system is
introduced. Version `spam-scam-en-v1` describes uncalibrated surface indicators with
known quote/negation/satire false positives and lexical/evasion misses. See
[rules, evidence semantics and development results](../ENGLISH_SPAM_SCAM.md).

```text
strict bounded V1 request
  -> declared language/category/context selection
  -> local text/conversation heuristics
  -> normalized-match to original-source evidence mapping
  -> exact category coverage and evidence validation
  -> portable V1 status/findings/provenance result
```

## Native categories and bounded conversation

Native categories are `toxicity`, `harassment`, `hate`, `threat`, and `sexual_risk`. Scores are deterministic rule signals, not calibrated probabilities or validated universal semantics. `profanity` and `spam_scam` remain unsupported by this adapter. Language hints match exact `en` or `und` (explicitly unknown); no detection/translation/region fallback is claimed.

The native lanes preserve parent text, quotations and bounded `replyTarget`. Parent hostility can enable a warning rule; direct address, group/self/reply hints, quote presence and continuity affect the internal legacy assessment. Quotes inside the current text can still cause false positives. Preserved context does not imply reliable attribution or author-intent understanding.

The core enforces 16,000 text code points, 4,000 per context field and 6,000 combined parent/quote code points. Content is never silently truncated. Exact context fields, including optional `replyTarget`, are part of the already-merged core 0.2.0 V1 extension; this change makes no further contract changes. Older strict V1 validators cannot accept that added property.

## Evidence and compatibility

`src/native/text.ts` retains the frozen rules and scores while recording the first actual match of each contributing rule. `src/native/evidence.ts` maps normalized UTF-16 indices to original source code points across trimming and lowercase expansion. `src/native-text-analyzer.ts` assigns trace items only to relevant positive categories. Contextual threat evidence includes the matched current warning and the hostile parent phrase. Unrelated quotes or enum values do not become invented source spans.

A positive finding without a valid contributing trace fails execution. The finite rule set remains below the public 64-item evidence bound; repeated matches are not occurrence counts. Actual spans can still support a mistaken heuristic classification, so quote/criticism false positives remain diagnostic findings.

`analyzeNativeContent()` preserves the internal legacy content envelope for private compatibility measurement. `analyzeNativeContentWithEvidence()` returns the same signals plus traces to the adapter. Subtype, severity, targeting, escalation and heuristic-confidence labels remain internal. They are not silently added to or inferred from the public V1 result. Composite analyzer version is `native-content-heuristic-v2.evidence-v1`; scoring lane versions remain frozen. See [provenance](../PROVENANCE.md).

## Validation and stopping point

Runtime request/result schemas, generated Draft 2020-12 artifacts and inferred types remain the contract source of truth. Structural schemas are portable; runtime refinements enforce aggregate context, uniqueness, reference/status consistency and original-request span/category checks.

`npm run check` typechecks, builds, runs contract/category/context/error/evaluation regressions, executes five examples and runs public diagnostics on CI's Node 22/24 matrix. `npm run eval:all` runs native, lexical, paired attribution, review and spam/scam diagnostics. `eval/compare-legacy.mjs` reads caller-authorized frozen legacy reports locally; no private fixture or runtime dependency is shipped.

The 40-case private comparison preserves content/category/severity behavior and records known attribution warnings. The new 32-case public diagnostic reports measured errors with pending human labels. Compatibility, regression correctness and production accuracy are distinct. Held-out independent quality evaluation, calibration, media/language expansion, Flaggr integration, deployment and publication remain outside this task.

The quality candidate is measured against that unchanged native diagnostic and a separate 35-case synthetic attribution challenge. The paired harness reports both fixes and new errors, with changed per-case score/evidence records. Tests retain positive detections and known misses, and explicitly test endorsement and independent author abuse. All labels remain provisional by user direction; this is development validation, not held-out proof or a model-quality certification.

## Phase T3 evaluation boundary

Repository-only `eval/review-dataset.mjs`, `evaluate-reviewed.mjs` and `run-review.mjs`
add explicit provenance/review/versioned dataset import, held-out reference checks and
coverage-aware comparative reports. They reuse public analyzers and existing metrics;
no runtime/public export or schema change is introduced. Review declarations and files
belong to evaluation tooling, not persistent content-analysis state. No database,
network model or Flaggr dependency is added. Nonpublic inputs/reports remain local.

The legacy diagnostic harness stays complete-coverage-only. The new review harness
supports explicit unsupported/partial probes, excludes missing context/category scores
from quality denominators, rejects invalid source witnesses, and distinguishes span
structure from optional annotation alignment. Actual independent human review and a
separately collected held-out corpus are still unperformed. See the [dataset specification](../TEXT_EVALUATION_DATASETS.md)
and [public T3 findings](../T3_BASELINE.md).

## Phase T4 annotation boundary

`eval/review-packet.mjs` and the existing review CLI provide prediction-free packets,
blank response templates and hash-bound submitted-label reconciliation. They reuse
the dataset validator/private artifact writer without importing an analyzer or changing
public exports. Split, source/context and provenance are retained; corrections create
new versions with separate audit receipts. This is offline evaluation preparation,
not Flaggr application review, routing, persistence or enforcement. No service/store,
model, actual human review or held-out corpus is introduced. See [the workflow and
draft guidance](../TEXT_ANNOTATION_REVIEW.md) and [T4 status](../T4_REVIEW_WORKFLOW.md).
