# Build status

Updated: 2026-10-30 · Phase 2 native extraction, not deployed or published.

The independent Phase 1 foundation at `f2e983cc37953aefbb8b7c2710c6a320b1db7097` passed `npm ci` and `npm run check` on Node 24.5.0 (72 tests) before extraction. Work uses an isolated checkout; the separate unfinished English-profanity files are untouched.

Implemented: optional `nativeTextAnalyzer`, independent native text/conversation/language/fusion modules and content types, bounded reply-target context, V1 request-schema regeneration, version `0.2.0`, native example/regressions, and provenance/architecture/decision docs. No new dependency, provider, database, network service or Flaggr integration is introduced. Default analysis remains unconfigured; package stays private and UNLICENSED.

Final verification PASS: clean `npm ci`, `npm run check` on Node 24.5.0 and Node 22.22.2 (85/85 tests each, no skips), and `npm pack --dry-run --json`. Both source and examples typecheck; build, contract/schema drift, native/error regressions, independence checks and both examples pass. The package preview has 49 entries and includes provenance; no private reports, fixtures, environment or database files are included. Whitespace and local Markdown links pass.

The private 40-case comparison has zero differences across all raw content scores, classification/severity/confidence, targeting/rationale/model metadata and five public scores. A separate 96-combination synthetic text/context grid also matches the original text facade's native content fields exactly. These are compatibility probes, not independently labeled model-quality data. Original synthetic-label counts remain TP 12/TN 10/FP 10/FN 8; private examples and reports were not copied into the public repository. The planner version intentionally differs, and public results retain their portable category/evidence shape rather than exposing all internal compatibility fields.

NOT_RUN: independently reviewed/held-out quality evaluation, production calibration, Flaggr runtime/decision/action parity, shadow comparison, live YouTube/hosted acceptance, deployment, npm publication and full-ingest load/performance. Local private reports are under `.local/`; [PROVENANCE.md](docs/PROVENANCE.md) records scope, hashes, findings and limits.
