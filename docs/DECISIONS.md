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
