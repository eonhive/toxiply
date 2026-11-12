# Toxiply core decisions

## T-033 — Benchmark accounting retains original inference limits

**Status:** implemented for review · **Date:** 2026-11-11

Review of merged PR #14 reproduced audit-cap and timeout-count errors when a custom
client mutated its passed byte-limit/signal properties. Snapshot the original values
before inference and use them for audit bounds, deadline observation and listener
cleanup. Preserve strict T7A behavior, V1, report shape, all scorers and frozen labels.
Add three synthetic regressions, not new accuracy evidence. No provider/model run,
telemetry fabrication, publication or merge. [Accounting limits](MODEL_BENCHMARK.md).

## T-032 — Hash-bound optional benchmarking and deadline review repair

**Status:** implemented for review; live benchmark NOT_RUN · **Date:** 2026-11-11

The owner confirmed no approved model configuration and selected runner-only work.
T7B reuses T7A, private immutable artifacts and the existing dataset/paired evaluators.
Require explicit model/checkpoint/quantization/license/use/privacy records, endpoint,
profile, prompt/client/runtime revisions, dataset/reference hashes and case/byte/time
limits. Default/CI commands never select live inference; live runs require private
configuration and `run --execute`. Declarations do not establish actual approvals.

Invoke once per applicable case and cache results across all five deterministic
baselines. Report status/scores, source audits, failure/deadline counts, matched-category
quality, client-side p50/p95 and client-process observations. Unavailable model-server
resources, tokens/costs and unannotated semantic evidence relevance stay null. Preserve
strict T7A validation, V1, all deterministic algorithms and existing labels.

Review of merged PR #13 reproduced acceptance of an expired result after event-loop
blocking. Add monotonic post-inference/post-validation checks and distinguish deadline
abort from normal cleanup; provenance becomes `model-json-v2+<hash>`. This strengthens
deadline handling without changing model output validation. No model framework, router,
provider access, weight download, training, Flaggr change, enforcement or publication.
[Configuration/procedure and exact limits](MODEL_BENCHMARK.md).

## T-031 — Optional bounded model inference without V1 changes

**Status:** implemented for review · **Date:** 2026-11-11

T7A explicitly authorizes `createModelTextAnalyzer(options)` with one typed client and
an optional fetch-based chat-completions transport. Caller-supplied model/client identity,
declared categories/languages/context and execution limits are required. No model/default
endpoint or global provider registry is introduced. The reference transport posts only
to an explicitly approved HTTPS or opted-in literal-loopback endpoint, refuses redirects,
bounds decompressed response bytes, and shares the adapter deadline/abort signal.

Require exact model/request/language/context echoes, complete category scores, evidence
references and literal source-quote/UTF-16 consistency. Reject incomplete/malformed output
without fallback scores. Source content stays untrusted data. Neither valid spans nor
capability declarations establish model accuracy or injection immunity.

V1 stays unchanged: `model_text` originally carried a `model-json-v1+` configuration hash
(v2 after the T-032 deadline repair),
with full non-secret model/client configuration retained out of band. Arbitrary model
names and weights/prompt digests need a separately versioned future provenance contract.
No secrets are fingerprinted. Identity echoes are consistency checks, not authentication.
All prior analyzers, T6B v2, frozen labels and confidence metadata remain unchanged.

Reuse existing evaluators with explicit canned responses and provisional synthetic
data. Isolated HTTP/mock tests are deterministic adapter evidence only. No live endpoint
was configured: real model quality/comparison, independent review and held-out evaluation
remain NOT_RUN. [Protocol, privacy, limits and verification](MODEL_TEXT_ANALYZER.md).
No mandatory model/network runtime, Flaggr changes, automatic actions or publication.

## T-030 — Conservative attribution review repairs

**Status:** implemented for review · **Date:** 2026-11-11

Review of merged PR #11 reproduced new misses for conditional disclosure advice and
denied scam-reporting frames. Narrow the candidate's exemptions with explicit denial
and trailing `unless`/`except` guards. Retain ambiguous cases under T6A scoring rather
than treating them as safe reports/warnings. Bump the composite to
`spam-scam-attribution-en-v2`; preserve all contracts, frozen scorers and dataset labels.
Add synthetic regressions and keep previous development metrics unchanged. This repair
does not claim general attribution/conditional-language understanding or promote the
candidate. PR #11 was already merged externally; PR #12 subsequently merged the v2 fix.

## T-029 — Separately versioned spam/scam attribution candidate

**Status:** implemented for review · **Date:** 2026-11-11

The user explicitly authorizes T6B implementation while independent validation continues.
Add `createEnglishSpamScamAttributionAnalyzer()` / `spam-scam-attribution-en-v1` as a
separate opt-in wrapper around frozen T6A. Exclude only bounded, explicitly framed
quotes, clause-initial negated credential requests and training examples with a direct
disclaimer. Preserve listed endorsement and independent solicitations, original UTF-16
evidence, unsupported semantic context, exact English coverage and uncalibrated scores.
Keep public V1 contracts, default behavior and every existing analyzer unchanged.

Reuse paired evaluation on the unchanged T6A dataset and a separately hashed synthetic
contrast set. All labels stay provisional; independent review is not invented or made
a prerequisite for this authorized local experiment. No default promotion, enforcement,
Flaggr changes, publication or deployment. [Exact grammar and evidence](T6B_SPAM_ATTRIBUTION.md).

Updated: 2026-11-11 · Scope: independent repository, Phases 1–2, T3–T5 evaluation and T6A

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

## T-024 — Versioned offline review datasets

**Status:** accepted for Phase T3 infrastructure · **Date:** 2026-10-31

Add repository-only `toxiply.text-eval.v1` datasets with explicit version, taxonomy,
label meaning, provenance, per-request category labels and review declarations.
Distinguish development, human-reviewed and held-out splits. Held-out declarations
require independent collection/freeze metadata and normalized text separation from
known reference material. Metadata is an attestation, not proof of human review,
rights or independence. Import exact bytes immutably into ignored/private locations.
Do not relabel exposed diagnostics as held-out or silently correct existing labels.

**Reason:** Make future independent review auditable without pretending that a model
or validation script can perform it. No Flaggr data or new dependencies are needed.

## T-025 — Coverage-aware quality and evidence denominators

**Status:** accepted · **Date:** 2026-10-31

Preserve the old frozen diagnostics. Add side-by-side review reports using the same
score-greater-than-zero metric, existing confusion helper and current analyzer exports.
Unassessed category/context requests never become negatives. Pair only mutually
assessed labels. Report actual status, missing capabilities, versions, dataset and
reference hashes, source-span validity and optional annotation alignment separately.
Failed/invalid execution is an error; version drift aborts aggregation. Structural
span correctness is not semantic accuracy. Keep default analysis and candidate opt-in
behavior, public 0.2.0 contracts and uncalibrated confidence unchanged.

**Reason:** Avoid inflated quality claims from unsupported requests, mixed versions,
invented witnesses or exposed synthetic examples. Real reviewed/held-out results and
candidate promotion require a separately bounded task with actual human evidence.

## T-026 — Prediction-free human annotation handoff

**Status:** implemented for review · **Date:** 2026-11-01

Extend the repository-only review CLI with opaque-ID packets omitting prior labels,
rationales, spans and predictions; deliberately incomplete response templates; and
hash-bound reconciliation of explicitly submitted human declarations. Reuse private
immutable import rules and dataset/category/source validation. Require a new version,
retain the original split, source/context/provenance and record label changes plus
source/packet/response/revision hashes. Never infer review from generated templates,
carry provisional spans into claimed human annotation, or upgrade exposed data to
held-out. Reviewer attestations and prediction-free packets do not prove identity,
rights, independence or blinding. Guidance remains a versioned provisional draft.

**Reason:** The user selected workflow implementation with labels kept provisional.
An approved corpus/reviewer is not available; implement a useful offline prerequisite
without inventing review results or changing heuristics, public contracts or defaults.

## T-027 — Independent validation requires real onboarding evidence

**Status:** preparation complete; independent validation pending · **Date:** 2026-11-01

Reuse T3/T4 tools without adding another review layer. Require actual owner permission,
private source/reviewer records, agreed versioned guidance, separately collected/frozen
held-out data and all known exposed references before independent quality claims. Raw
unlabeled collections require initial human annotation before creating complete V1;
do not invent labels or review declarations to use the packet validator. Record manual
leakage checks for incompatible reference formats, contexts and paraphrases, beyond
the CLI's normalized main-text comparison. Keep development observations distinct.

**Reason:** No approved corpus/reviewer/rights/freeze records were supplied for T5.
Complete the [readiness/onboarding report](T5_VALIDATION_READINESS.md), verify unchanged
baseline behavior and stop. The single proposed victim-report experiment requires later
independent contrast review and a separate implementation decision; no analyzer change
or promotion follows from this preparation task.

## T-028 — Optional versioned English spam/scam surface indicators

**Status:** implemented for review · **Date:** 2026-11-11

T6A explicitly authorizes a separate `createEnglishSpamScamAnalyzer()` factory,
`english-spam-scam` / `spam-scam-en-v1`, through the existing one-analyzer execution
path. Only `spam_scam` and exact `en` are supported; absent hints remain unsupported
`und`. Set `supportsContext: false` and preserve the core's partial-context behavior.
Keep 0.2.0 V1 contracts/identifiers, default analysis, native/contextual/lexical analyzers,
dependencies and private/UNLICENSED package metadata unchanged.

Positive means an implemented combination of suspicious surface cues in a 240-unit
UTF-16 window, not verified fraud, identity, unsolicited delivery or author intent.
Return every contributing cue as original-text evidence and use fixed uncalibrated
scores (maximum across matched rules). A lone link, brand, currency/amount, urgent
word or ordinary discount is insufficient. Do not suppress arbitrary quotes or claim
semantic context support; quote, warning, negation, satire and evasion errors are explicit.
No URL fetching, reputation, credential checks, tenant history, policy or action occurs.

Reuse the existing versioned dataset format, comparator, confusion metrics and source
audit for a separately hashed 48-case public synthetic development diagnostic.
All labels remain provisional; native's unsupported `spam_scam` results have no quality
denominator. Keep existing diagnostic bytes and T5 independent-validation gates intact.
Document exact [rules, findings and limitations](ENGLISH_SPAM_SCAM.md).

**Reason:** Independent human validation continues separately and does not block bounded
local feature development. A new optional content-only capability does not implement
T5's deferred attribution experiment or authorize promotion, production enforcement,
Flaggr changes, additional infrastructure, merging or publication.
