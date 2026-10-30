# Independent Toxiply core

Updated: 2026-10-30 · Status: Phase 2 text/conversation analysis

## Boundary and execution

One TypeScript library runs in process with no Flaggr runtime imports, database, additional server, Python, or required model/provider. Applications own persistent history, tenant policy, review, routing and actions. Zod is the only runtime dependency. No Flaggr production integration is performed here.

`analyze()` remains unconfigured. `createAnalyzer(nativeTextAnalyzer)` selects the already-audited text/conversation/language/fusion extraction. A separate `createEnglishProfanityAnalyzer()` supplies narrowly specified lexical presence, without implying that the native analyzer supports profanity. Custom analyzers use the same local interface.

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

`npm run check` typechecks, builds, runs contract/category/context/error/evaluation regressions, executes three examples and runs both public diagnostics on CI's Node 22/24 matrix. `npm run eval:all` runs public native and lexical diagnostics. `eval/compare-legacy.mjs` reads caller-authorized frozen legacy reports locally; no private fixture or runtime dependency is shipped.

The 40-case private comparison preserves content/category/severity behavior and records known attribution warnings. The new 32-case public diagnostic reports measured errors with pending human labels. Compatibility, regression correctness and production accuracy are distinct. Held-out independent quality evaluation, calibration, media/language expansion, Flaggr integration, deployment and publication remain outside this task.
