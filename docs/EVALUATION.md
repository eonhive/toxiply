# Text evaluation and compatibility baseline

## T7B benchmark preparation — live NOT_RUN

PR #14 review repair snapshots inference limits before custom clients run. Mutating
passed limits can no longer widen/suppress response auditing or hide timeout counts.
Three regression probes reproduce the prior failures; normal canned diagnostic and
quality denominators remain unchanged. This fixes measurement accounting only, with
no new real-model quality/performance claim or output-validation relaxation.

The owner confirmed no approved real-model configuration. The [optional benchmark
runner](MODEL_BENCHMARK.md) is mock-tested only, with explicit private provenance and
dataset/reference binding for future approved execution. It caches each model result
and reuses existing paired evaluation across all five deterministic baselines. Use
`paired.categories` for common-category TP/TN/FP/FN/precision/recall; marginal per-engine
reports have different denominators. Missing context/language/category or failed calls
never become benign classifications. Source-span audits of rejected output are separate
from accepted evidence/optional annotation alignment; unannotated relevance remains null.

Per-case client-side durations and nearest-rank p50/p95 include failed invocation time.
Client CPU/RSS/heap observations are not model-server resources; tokens/costs/GPU remain
null with explicit reasons. Mock timings/perfect canned labels are not real performance
or accuracy. Existing datasets/labels remain unchanged. T7A deadline repair changes
adapter provenance to model-json-v2 while preserving output validation/diagnostic counts.
Real-model reliability, independent/held-out results, calibration and live comparisons
remain NOT_RUN. `eval:model-benchmark` in `eval:all` always runs canned mock inference.

## T7A adapter execution, not trained model quality

`npm run eval:model-adapter` reuses the existing versioned dataset/evaluator with
explicit canned synthetic model responses. Fourteen requests yield 11 completed,
1 partial-category and 2 unsupported-language results; 9 source witnesses are valid.
The 11 assessed whole cases reproduce 8 fixture positives/3 negatives without errors.
The report labels this `CANNED_FIXTURE_REPLAY_NOT_MODEL_QUALITY`, liveModel NOT_RUN;
its perfect fixture rates are not model accuracy. Provisional labels/hashes and exact
scope are in [the T7A report](MODEL_TEXT_ANALYZER.md). No old dataset/label changes.

Tests exercise strict separate category mapping, context/quotation/data separation,
UTF-16 spans, malformed/incomplete responses, deadlines/network/redirect/size failures
and confidential errors. The isolated local chat server is a mock, not trained inference.
Live-model comparisons, independent review/held-out evidence and calibration are NOT_RUN
because no live configuration or approved model corpus was supplied. Future actual
model comparisons must use mutually assessed categories/context and preserve all frozen
heuristic references; unsupported results never become benign scores. Include these new
exposed synthetic fixtures in reference/leakage audits, not T5 held-out validation.

## T6B spam/scam attribution experiment

Review repair `spam-scam-attribution-en-v2` fixes reproduced missed solicitations in
conditional credential advice and denied reporting frames. Eight new synthetic
regression probes preserve actual source spans. Both frozen diagnostic reports remain
identical apart from the candidate version; original labels and hashes are unchanged.
These tests are development evidence, not a new independent quality dataset.

`npm run eval:spam-attribution` reuses the paired review evaluator on frozen T6A and
a new 24-case provisional public synthetic challenge. T6A remains 15/23/5/5 TP/TN/FP/FN;
the candidate records 15/27/1/5. Challenge results are 14/0/10/0 versus 14/8/2/0.
No new FP/FN/category regressions appear on either development set. Semantic span
accuracy is unmeasured; structural evidence remains valid. Existing diagnostic bytes
and labels are unchanged. See [hashes, group errors, exact semantics and limits](T6B_SPAM_ATTRIBUTION.md).
The candidate remains opt-in; human-reviewed/held-out results are NOT_RUN. Include the
new exposed dataset in future reference/leakage audits; it is not T5 validation data.

Updated: 2026-11-11 · Native/lexical/spam-scam diagnostics and review tooling; human review pending

## Commands and interpretation

[Phase T5 readiness](T5_VALIDATION_READINESS.md) records a fresh unchanged-baseline
verification, existing-tool audit, initial-annotation/onboarding procedure and the exact
missing corpus/reviewer/rights/freeze records. Independent reviewed/held-out results are
NOT_RUN. Its one future heuristic proposal is based only on measured provisional errors;
neither analyzer nor existing labels are changed.

```sh
npm ci
npm run check
npm run eval:all
```

`eval:native` runs the 32-case native diagnostic; `eval:text` retains the existing 36-case lexical-profanity diagnostic. `eval:all` also runs paired attribution, coverage-aware review and the new `eval:spam-scam` report. Reports contain exact UTF-8 dataset SHA-256, provenance, algorithm versions, confusion counts, per-group metrics, mismatch IDs and evidence. Native reports also contain per-category metrics. Rates with zero denominators are `null`.

Mismatches are diagnostic findings, not command failures. Incomplete, unsupported, failed, malformed, wrong-coverage or version-inconsistent execution fails the harness instead of being counted benign. Tests verify metric/error handling separately from algorithm behavior. No examples, labels or rules were retuned to produce a quality pass.

The public datasets were independently authored with Codex for this repository. They are synthetic development diagnostics, created alongside the algorithms, with explicit labels/rationales and **pending human review**. They are not representative production data, independently labeled held-out validation, or calibration evidence. Public fixture examples were not copied from private Flaggr data.

## Native text: public 32-case baseline

Dataset: [native-text-diagnostic-v1](../eval/native-text.v1.json)

SHA-256: `9d8f5dcd196a565b03c618af00cc5f4f5d4f658666183c612248b3f577eb3a34`

Algorithm: `native_content` / `native-content-heuristic-v2.evidence-v1`; core `0.2.0`.

Labels identify current-author harm categories, treating criticism and quoted reporting as non-endorsement. Positive prediction means category score greater than zero; overall positive means any native category is positive. This compares uncalibrated rule activity against the stated provisional labels, not a moderation action threshold or severity policy.

| Group | Cases | TP | TN | FP | FN |
| --- | ---: | ---: | ---: | ---: | ---: |
| Benign | 4 | 0 | 4 | 0 | 0 |
| Criticism | 4 | 0 | 2 | 2 | 0 |
| Quoted reporting | 4 | 0 | 1 | 3 | 0 |
| Harassment | 4 | 4 | 0 | 0 | 0 |
| Threat | 4 | 3 | 0 | 0 | 1 |
| Hate | 4 | 2 | 0 | 0 | 2 |
| Sexual risk | 4 | 3 | 0 | 0 | 1 |
| Evasion | 4 | 1 | 0 | 0 | 3 |
| Total | 32 | 13 | 7 | 5 | 7 |

Class balance: 20 provisional positives / 12 negatives. Against these labels: precision 72.2%, recall 65.0%, false-positive rate 41.7%, false-negative rate 35.0%.

| Category | TP | TN | FP | FN |
| --- | ---: | ---: | ---: | ---: |
| Toxicity | 13 | 7 | 5 | 7 |
| Harassment | 13 | 7 | 5 | 7 |
| Hate | 3 | 26 | 1 | 2 |
| Threat | 3 | 26 | 1 | 2 |
| Sexual risk | 3 | 28 | 0 | 1 |

Known failures include criticism and current-text quotes being treated as harmful author statements, implied threats, discriminatory exclusion without known patterns, unrecognized sexual requests and spelling evasion. Separate quoted context is retained without automatically attributing it to the author. Rule-level source spans improve structural attribution, but do not fix semantic misclassification. This task preserves the scorer rather than claiming quality improvement.

After building, save JSON with `node eval/run-native.mjs > /tmp/toxiply-native-report.json`.

## Frozen legacy comparison: local authorized fixtures

`eval/compare-legacy.mjs` reads an existing frozen offline Flaggr baseline report supplied by the caller. It imports only local Toxiply built content modules and never invokes Flaggr, networking, storage or policy. Private examples and reports stay outside public commits and public CI. Reproduce with an authorized fixture file:

```sh
npm run build
node eval/compare-legacy.mjs /absolute/path/to/authorized-frozen-report.json > .local/legacy-comparison.json
```

Create the ignored output directory first if needed. The comparator records the exact report-file hash, dataset identity/hash, each matching/differing content field, public category-score differences, severity differences, intentional planner changes, unsupported legacy concepts and quote-attribution warnings. Media/provider paths and out-of-bounds/nonportable context are reported as unsupported, not converted into reassuring zeros. The CLI returns nonzero for incomplete or unexpected parity differences.

Actual comparison: **40/40 content matches and 40/40 public category-score matches; zero category or severity differences; zero unsupported cases; four quoted-report attribution warnings.** Frozen lane/subtype/severity/targeting/rationale outputs remain unchanged. Planner identity and the versioned public evidence representation intentionally differ. Legacy inputs have no exact spans; there is no claim of legacy span parity.

The legacy diagnostic dataset hash remains `46f5d453c899b0c6c8b104ab752bb37839ca1e246168e03bedd74a99febac652`. Its provisional error counts remain **12 TP / 10 TN / 10 FP / 8 FN** for both implementations. This is the same old synthetic set, not a quality gain or a comparison of percentages across different datasets.

Subtype, severity, targeting, escalation, rationale, heuristic-confidence labels and per-lane versions are compared in the internal content envelope, but have no corresponding public V1 result fields. They are reported as not exposed, not silently reconstructed from category scores. Platform history, policies, actions, media and providers are outside this comparison. Public harness tests use explicitly labeled independent synthetic probes; they are not presented as real legacy fixtures.

The exact private input/output files are under ignored `.local/phase2-text-validation/` in the implementation checkout. They are intentionally not packaged or published. The existing provenance record identifies source-scope ownership/authorization; this change transfers no additional private source or fixtures.

## Separate literal profanity diagnostic

Dataset: [english-profanity-diagnostic-v1](../eval/english-profanity.v1.json)

SHA-256: `d8269d080c11da697870c4aa19a4ed83164406b4c9aa7b23a2ad69cf8b716ef4`

Algorithm: `english-literal-profanity` / `literal-en-v1`.

| Group | Cases | TP | TN | FP | FN |
| --- | ---: | ---: | ---: | ---: | ---: |
| Literal | 8 | 8 | 0 | 0 | 0 |
| Quoting/reporting | 4 | 4 | 0 | 0 | 0 |
| Unlisted | 4 | 0 | 0 | 0 | 4 |
| Obfuscated | 8 | 0 | 0 | 0 | 8 |
| Benign | 8 | 0 | 8 | 0 | 0 |
| Boundaries | 4 | 2 | 2 | 0 | 0 |
| Total | 36 | 14 | 10 | 0 | 12 |

This dataset asks about surface profanity, including quoted/reporting text, not author endorsement. It has 26 provisional positives / 10 negatives; precision 100%, recall 53.8%, false-positive rate 0%, false-negative rate 46.2% on these labels only. A zero lexical signal does not establish profanity-free text. The absence of false positives in this development set establishes no production precision. Do not compare this label definition directly to the native harm-attribution labels.

## Remaining evidence

T6A adds a separately versioned [English spam/scam synthetic diagnostic and comparison
report](ENGLISH_SPAM_SCAM.md#synthetic-diagnostic-and-comparison-report). The 48 public
same-author development cases use existing `toxiply.text-eval.v1`, version `1.0.0`,
provisional labels and SHA-256
`94280d4d105f9ad240b3cfeb4fbb12a788da2ca1ef32044da28e600b937a87c7`.
Algorithm `english-spam-scam` / `spam-scam-en-v1` records 15 TP / 23 TN / 5 FP / 5 FN,
48 completed, 51 source spans checked, 0 invalid. No gold semantic spans are supplied.
Per-group errors and exact IDs include quoted warnings, negated advice, satire,
obfuscation and unlisted wording. The native baseline is unsupported on all 48 cases;
its quality denominator is zero, rates null and no paired accuracy gain is claimed.

Run `npm run eval:spam-scam`, or build then `node eval/run-spam-scam.mjs` for pure JSON.
The runner reuses the existing coverage-aware evaluator and fails on incomplete or
invalid candidate execution. Rule presence is not author intent; labels intentionally
retain that distinction. Neither the new corpus nor its measured errors enter T5's
held-out evaluation. Include this exposed dataset in future manual leakage audits and
as an explicit compatible `--reference` when using the review CLI; its built-in
reference list remains unchanged. Independent review/held-out validation are NOT_RUN.

Phase T3 adds [versioned review/import infrastructure](TEXT_EVALUATION_DATASETS.md)
and a [baseline-versus-candidate audit report](T3_BASELINE.md). Existing diagnostic
files, labels and scorers remain frozen. `node eval/run-review.mjs compare` adds
explicit unassessed denominators, language/category coverage, per-category FP/FN IDs,
paired comparable-category deltas and independent source-span checks. Optional span
annotations measure alignment only where supplied, under their stated review status.
Current public annotations are provisional; independent semantic adjudication remains
unperformed. Nonpublic approved corpora and reports must remain ignored/outside Git.

The new review runner records expected partial/unsupported coverage separately and
excludes missing analysis from quality denominators. It reports failed/invalid
executions and exits nonzero; inconsistent analyzer versions abort evaluation. These
rules do not relax the older native/paired diagnostic harnesses' complete-coverage
requirements. No collected or human-reviewed dataset is bundled or invented.

Human reviewers must check category definitions, criticism, reported/quoted abuse, implied threats, protected-group targeting, solicitation and evasion examples. Record attribution and corrections only after actual review; version label changes and rerun hashes/reports. A separately collected and independently labeled held-out corpus, calibration and any production action policy remain unimplemented. No production integration is authorized by diagnostic parity.

## Offline annotation workflow

Phase T4 adds [packets, response templates, reconciliation and draft guidance](TEXT_ANNOTATION_REVIEW.md).
It omits old labels/predictions from the reviewer packet, validates submitted labels
against exact source/packet hashes, and writes a new private immutable dataset version
with an audit receipt. Original splits, text/context/provenance and existing dataset
bytes remain unchanged. Blank annotations do not count as review; actual human records
and an independently collected/frozen corpus are still required. All committed labels
remain provisional by user direction. [T4 verification and limits](T4_REVIEW_WORKFLOW.md)
report infrastructure tests separately from unchanged development quality metrics.

## Paired contextual attribution experiment

Run `npm run eval:quality` or the full `npm run eval:all`. The paired runner applies the frozen native baseline and opt-in `contextual_content` / `contextual-attribution-v1` to the same dataset text, labels and category definitions. It reports both models' complete group/category metrics, fixed/new false positives and negatives, category-label improvements/regressions, and changed per-case scores and evidence. Failed or incomplete execution aborts comparison. The baseline native and lexical datasets and their labels remain unchanged.

The user explicitly chose to keep labels provisional for this PR. All results below are development observations only. The new challenge was created alongside the candidate and is not independently labeled, blind or held-out. The earlier native/legacy sets were already known during development and cannot serve as independent validation either.

| Dataset / analyzer | Cases | TP | TN | FP | FN |
| --- | ---: | ---: | ---: | ---: | ---: |
| Frozen native / baseline | 32 | 13 | 7 | 5 | 7 |
| Frozen native / candidate | 32 | 13 | 12 | 0 | 7 |
| Attribution challenge / baseline | 35 | 19 | 0 | 16 | 0 |
| Attribution challenge / candidate | 35 | 19 | 14 | 2 | 0 |

Against these provisional labels, the candidate fixes 5 overall false positives on the original diagnostic and 14 on the challenge. Neither set has a new overall false positive, false negative or category-label regression. Category-label improvements number 12 and 32 respectively; these are not independently validated improvements. Existing implied-threat/evasion/unlisted-semantic misses remain on the original set.

The [35-case challenge](../eval/context-attribution.v1.json) has 19 provisional positive and 16 negative labels. It probes reporting, product criticism, explicit endorsement, mixed independent author abuse, direct attacks and quotation ambiguity. Its remaining false positives are `reporting-7` (an unquoted victim report) and `reporting-8` (an unmatched quotation). Endorsement, direct-author and mixed-abuse probes retain their detections. The absent broader grammar is an explicit limitation, not evidence that all reporting is understood.

Challenge SHA-256: `52b18106a2473d2001168069795c716fd8827fff8430ebf6e89f9986e382f4c7`.

The original native hash remains `9d8f5dcd196a565b03c618af00cc5f4f5d4f658666183c612248b3f577eb3a34`. Tests assert that identity and retain known misses rather than modifying labels to fit predictions. To save paired JSON after building, run `node eval/run-quality.mjs > /tmp/toxiply-attribution-comparison.json`.

An additional local paired run on the same frozen private 40-case legacy fixtures records baseline 12 TP / 10 TN / 10 FP / 8 FN and candidate 12 TP / 13 TN / 7 FP / 8 FN, with no new overall false positives or false negatives. Only binary legacy labels were used as truth; category ground truth and public severity were not fabricated. The original native compatibility comparator still matches all 40 raw legacy content results. Full private paired results remain ignored under `.local/contextual-quality/` and are not published or packaged.

The candidate remains opt-in; baseline behavior is unchanged. Reviewers must assess finite reporting/endorsement grammar, ambiguous product/person nouns, unrecognized endorsement, long/multiline/nested quotations and nonlocal references using a separately labeled corpus before drawing general quality conclusions. No default promotion, deployment, Flaggr integration, calibration or production safety claim follows from these diagnostics.
