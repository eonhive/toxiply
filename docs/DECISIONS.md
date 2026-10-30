# Toxiply core decisions

Updated: 2026-10-30 · Scope: independent repository, Phase 1

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
