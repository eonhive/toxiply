# Native extraction provenance and validation

Updated: 2026-10-30. Scope: owner-directed migration of EonHive's deterministic content modules into the independent Toxiply library. Package publication remains disabled (`private: true`, `UNLICENSED`); this extraction does not grant an open-source license or settle future distribution rights.

## Source audit

The source repository is `eonhive/flaggr`, frozen at `8f176ff7fad978f7f8f81f8daef8416ded4d6d6e`. Its source history attributes these modules to Stan Nesi, and its product canon identifies EonHive. No third-party copyright/license banners, vendored libraries, or LICENSE/COPYING/NOTICE files were found in this source scope. The owner explicitly selected native-analyzer extraction for this task. Attribution is retained in module headers and this record; no broader licensing claim is made.

| Source path | Destination | Source SHA-256 |
| --- | --- | --- |
| `services/toxiply-text/src/analyze-native-text.ts` | `src/native/text.ts` | `54edd9f46e4209cf0ac174605552f97828fd6babf7d05c96594557221462eb24` |
| `services/toxiply-conversation/src/analyze-conversation-evidence.ts` | `src/native/conversation.ts` | `7c2c1e36722cad30d63f4e83584d9a7cf875418b8a63fed97630dd06f1c0d747` |
| `services/toxiply-multilingual/src/prepare-multilingual-input.ts` | `src/native/language.ts` | `1852734d93b21f005d8dbca11bea0a3f53dbe5f8fa0fedd1f7635093a4a6df0a` |
| `services/toxiply-aggregator/src/aggregate-toxiply-signals.ts` | `src/native/fusion.ts` | `cdd426c5b1dcd216b326cdfcb0cadff57bf61c4f49427e1281b7ec1d5865f1ee` |

Changes are limited to independent local content types/imports, ESM suffixes, strict optional-type annotations, headers, native composition, and removal of provider-only inputs/fusion branches. Native pattern lists, scores, subtype/severity/confidence calculations, targeting, summaries and model versions are retained. Planner metadata uses `native-content-heuristic-v2` instead of claiming execution by Flaggr's router.

No Flaggr events/tenant/user/policy/action types, context stores, connectors, provider clients, source journals, database schema, runtime secrets, deployments or diagnostic datasets were moved. Existing public Phase 1 fixtures remain public fixtures; the new regression examples were authored for this repository. Unfinished English-profanity work in another checkout was not imported or modified.

## Parity method and observed result

A private local harness read the existing `social-comments-en-v1` diagnostic report directly from the Flaggr verification worktree. It supplied each case's text and bounded conversation context to the extracted native composition, and separately called the public `createAnalyzer(nativeTextAnalyzer)` path. Private examples/expected outputs were not copied here; the local evidence is ignored under `.local/`.

- **40/40 match**, zero differences in all six raw scores, subtype, severity, heuristic confidence, targeting, rationale, lane model versions, aggregator version, source modalities and external-use flag.
- All five public category scores also match their corresponding native baseline scores, with completed coverage for every valid English request.
- A separate 96-combination synthetic text/parent/quote/target/language-hint grid also matches the original native text facade on the listed content fields. It is compatibility regression coverage, not an independently labeled corpus or language-quality measurement.
- The planner identifier is intentionally different. Media, external-provider behavior, Flaggr policy/rules/decisions, platform context, persistence and source actions were not compared or enabled.
- Dataset SHA-256: `46f5d453c899b0c6c8b104ab752bb37839ca1e246168e03bedd74a99febac652`.
- The unchanged provisional labels produce TP 12, TN 10, FP 10, FN 8. These deliberately difficult synthetic cases are not production accuracy, calibration, held-out validation or independent label review.

For another parity run, use the frozen source revision and dataset hash above, retain the raw content fields unchanged, compare the listed content fields, and exclude the intentionally changed planner identifier. Validate the public five-category scores separately. Do not retune examples, labels or keyword exceptions to make the comparison pass. Keep private inputs and reports outside public commits.

## Current limits and remaining gates

Only the extracted native content path is preserved. The public result contract exposes category scores, evidence, coverage and composite analyzer provenance. Internal compatibility details are not an additional public API; Phase 3 must define/test their mapping before replacing Flaggr's stored `ToxiplySignals`/decision behavior.

The legacy algorithms do not provide exact token-level attribution, so evidence identifies whole assessed fields. Context processing remains heuristic and may misattribute criticism/quotes. Language preparation is pass-through, not detection or translation. English and unknown-language execution are explicit opt-ins, not measured multilingual support. Profanity, spam/scam, pixels, OCR, speech recognition, acoustic analysis and video remain unimplemented by this adapter.

Independent label review and a separate realistic held-out corpus are **NOT_RUN**. There is no model-quality improvement, safety automation, Flaggr cutover, deployment, npm release, or live source acceptance claim. These gates remain prerequisites for later production use. Keep the legacy Flaggr runtime available during future shadow comparison and preserve its latest audit/journal data during rollback.
