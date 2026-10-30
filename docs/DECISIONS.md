# Toxiply core decisions

Updated: 2026-10-30 · Scope: independent repository, Phases 1–2

## T-013 — Independent content boundary

**Status:** accepted · **Date:** 2026-10-30

Toxiply is a reusable content-intelligence library. Consumers own tenant/workspace identity, persistent actor/history context, review, policy, routing, and actions. Historical descriptions that grouped SpamMemory, SwarmSense, SignalRank, PrimeRoute, or OpportunityIQ into Toxiply do not authorize implementing or importing those application-owned systems here. Product names remain unchanged.

**Reason:** A portable analysis contract must work independently of any application or persistence layer.

## T-014 — One TypeScript package

**Status:** accepted · **Date:** 2026-10-30

Ship one in-process ESM library with no required database, HTTP server, Python runtime, Flaggr dependency, or external AI provider. One optional local analyzer interface is sufficient for Phase 1.

**Reason:** Establish a small, independently testable boundary before adding inference implementations or deployment infrastructure.

## T-015 — Honest foundation coverage

**Status:** accepted · **Date:** 2026-10-30

Phase 1 ships no classifier. Unconfigured analysis is explicitly unsupported. Completed/partial behavior is tested with clearly labeled synthetic analyzers. Findings require actual reported coverage, provenance and valid evidence. Scores are uncalibrated signals; missing categories never receive synthetic benign scores. No image, voice, OCR, multilingual accuracy, or production-model claim follows from the existence of the contract.

**Reason:** An interface foundation should not introduce unevaluated moderation behavior or fabricate model capabilities to demonstrate its API.

## T-016 — Independent source and publication boundary

**Status:** accepted · **Date:** 2026-10-30

Author the foundation and fixtures independently. Do not copy private implementations or datasets until provenance, licensing, and publication rights are reviewed. Keep the npm package private and UNLICENSED until an explicit licensing/publication decision. Local research/reference documents are not publication inputs.

**Reason:** Repository visibility does not grant redistribution rights to private material or settle the new package's license.

## T-017 — First native capability is opt-in literal English profanity

**Status:** accepted · **Date:** 2026-10-30

Add `createEnglishProfanityAnalyzer()` using independently authored exact-token vocabulary. Support only the existing `profanity` category and exact `en` hint, without a mandatory provider or new dependency. Keep the default `analyze()` unconfigured and preserve the V1 contracts. A binary score reports presence of one documented token, not severity, safety, or calibrated probability. The first token supplies one source-relative witness. Quotes/reports count literally, with no author-intent claim. Semantic context, evasion interpretation, unlisted words, and other categories remain outside this algorithm's stated coverage.

**Reason:** Exercise the independent contract with real, bounded, reviewable behavior before introducing broad moderation semantics or model assets.

## T-018 — Diagnostic labels and production evidence remain distinct

**Status:** accepted · **Date:** 2026-10-30

Add an offline, versioned synthetic diagnostic with explicit labels/rationales, data hash, review status, analyzer versions, per-group confusion metrics, and evidence. Include deliberately unsupported forms without changing their labels to fit the implementation. Unavailable/failed analysis fails the harness rather than becoming a benign zero. Mismatches remain diagnostic findings, separate from test failures. Codex-authored labels remain pending human review until an attributed human review actually occurs.

**Reason:** Make limitations measurable without claiming independent validation, calibration, or production accuracy from a development diagnostic.

## T-019 — Opt-in native extraction with preserved behavior

**Status:** implemented for review · **Date:** 2026-10-30

Port only the audited EonHive native text, bounded conversation, pass-through language preparation and native fusion modules listed in [PROVENANCE.md](PROVENANCE.md). Replace platform imports with local content types and remove provider-only branches; do not change native scoring to improve diagnostic results. `createAnalyzer(nativeTextAnalyzer)` explicitly enables the legacy heuristics. Default `analyze()` remains unconfigured. No Flaggr adapter, provider, store, service, action or deployment is added.

The public adapter supports five content categories and English/unknown hints; unavailable categories/languages remain explicit. Composite analyzer version `native-content-heuristic-v2` identifies the frozen lane versions. Full internal content assessment is retained for parity checks but does not extend the public result with platform fields. Whole-field evidence spans describe assessed inputs, not precise harmful-phrase localization or calibrated probabilities.

**Reason:** Establish independent deterministic behavior before changing inference quality or wiring a platform consumer. Private baseline examples remain private; matched synthetic results do not establish production accuracy. Licensing/publication metadata remains unchanged and npm publication stays disabled.

## T-020 — Bounded reply-target context

**Status:** implemented for review · **Date:** 2026-10-30

V1 text context additionally accepts optional `replyTarget: parent_author | group | self | unknown`. This is additive bounded semantic context, required to preserve the extracted targeting/escalation behavior; it is not a persistent actor ID, workspace role or policy. Engines without context support have it stripped and return partial coverage. Unknown values fail validation. Engine/package version is `0.2.0`; existing request/result schema identifiers remain V1 and existing request shapes remain valid.

## T-021 — Actual rule evidence with unchanged scoring

**Status:** accepted · **Date:** 2026-10-30

Replace the native adapter's whole-field assessment witnesses with the actual first match of each contributing rule and category-specific references. Map normalized offsets to unchanged UTF-16 source fields, including Unicode case expansion. Never attach unrelated quoted/parent fields or invent a span for enum targeting metadata. Preserve scoring, internal subtype/severity/targeting, uncalibrated confidence and the current V1 contracts. Composite version `native-content-heuristic-v2.evidence-v1` identifies this evidence change without pretending that classification quality improved.

The local 40-case legacy comparison and public native/lexical diagnostics are separate checks. Private fixtures/reports remain private, and the public comparison harness requires caller-authorized local inputs. Full public evaluation runs through `npm run eval:all` and CI. Human labels remain pending review.

**Reason:** A positive finding needs a real contributing witness; valid structural offsets alone are insufficient. Compatibility and quality must be measured and reported separately.

**Decision-log maintenance:** Two merged PRs both used T-017/T-018. The extraction and bounded-target entries are now uniquely identified as T-019/T-020. Their earlier behavior remains historical; T-021 replaces whole-field evidence only.

## T-022 — Separately versioned attribution candidate

**Status:** accepted as an opt-in experimental candidate · **Date:** 2026-10-30

Add `contextualTextAnalyzer` / `contextual-attribution-v1` without changing the frozen native analyzer or public V1 contracts. Recognize a narrow local grammar of reported/third-party balanced quotations and product-directed insult terms. Explicit nearby endorsement and personal comparisons keep baseline behavior. Rescore remaining current/parent text with length-preserving non-whitespace barriers, retain other context, and reject artificial cross-mask witnesses by falling back to the baseline. Do not introduce general quote/keyword exemptions or claim reliable author-intent classification.

**Reason:** Make a focused, reversible quality experiment with real source evidence and measured regressions while preserving compatibility consumers' baseline.

## T-023 — Paired development evidence, provisional labels

**Status:** accepted · **Date:** 2026-10-30

Keep the original native diagnostic and labels unchanged. Add a separate synthetic attribution challenge and deterministic paired comparison reporting fixed/new false positives and negatives, category-label improvements/regressions, score changes and evidence. Include explicit endorsement, mixed independent abuse, known unsupported reporting grammar, and personal comparisons. The user explicitly chose to keep labels provisional for this PR. Neither same-author development set is an independently reviewed or held-out corpus, and the candidate is not a default promotion or production-integration change.

**Reason:** Observed improvements must remain distinguishable from independent quality validation, and labels must not be silently tuned to candidate predictions.
