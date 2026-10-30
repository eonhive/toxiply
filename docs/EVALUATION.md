# Text evaluation and compatibility baseline

Updated: 2026-10-30 · Native and lexical diagnostics; human label review pending

## Commands and interpretation

```sh
npm ci
npm run check
npm run eval:all
```

`eval:native` runs the 32-case native diagnostic; `eval:text` retains the existing 36-case lexical-profanity diagnostic. `eval:all` runs both. Reports contain exact UTF-8 dataset SHA-256, provenance, algorithm versions, confusion counts, per-group metrics, mismatch IDs and evidence. Native reports also contain per-category metrics. Rates with zero denominators are `null`.

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

Human reviewers must check category definitions, criticism, reported/quoted abuse, implied threats, protected-group targeting, solicitation and evasion examples. Record attribution and corrections only after actual review; version label changes and rerun hashes/reports. A separately collected and independently labeled held-out corpus, calibration and any production action policy remain unimplemented. No production integration is authorized by diagnostic parity.
