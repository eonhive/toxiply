<!--
Company: EonHive Inc. | Title: T3 public text quality baseline
Purpose: Record development comparisons, coverage, evidence checks and remaining gates.
Author: Stan Nesi | Created: 2026-10-31 | Updated: 2026-10-31
Notes: Vibe coded with Codex.
-->
# Phase T3: public text quality baseline

Base: `449f831` (merged contextual candidate PR #5). Baseline `npm ci`,
`npm run check` and `npm run eval:all` PASS on Node 22.22.2; check includes
179 existing tests, source/example typecheck, build and four executed examples.
No baseline command failure was observed. Scorers, public contracts and all existing
labels remain unchanged. The separate lexical diagnostic remains 14 TP / 10 TN /
0 FP / 12 FN on 36 provisional surface-presence examples.

These are **exposed synthetic development datasets with provisional labels**.
No independently human-reviewed or genuinely held-out evaluation was performed.
Neither improvements nor zero observed errors establish production accuracy,
calibration or safe moderation. This document summarizes only explicitly public
repository inputs, never external/private imports or reports.

Reproduce after building:

```sh
mkdir -p .local/reports
node eval/run-review.mjs compare > .local/reports/t3-comparison.json
```

Raw reports remain ignored. See [dataset/review workflow](TEXT_EVALUATION_DATASETS.md).
The legacy metadata adapter conservatively marks unrecorded visibility private;
this public aggregate is authorized only for the three repository files listed below.

## Identity and versions

| Dataset | SHA-256 of unchanged UTF-8 input |
| --- | --- |
| native-text-diagnostic-v1 | `9d8f5dcd196a565b03c618af00cc5f4f5d4f658666183c612248b3f577eb3a34` |
| context-attribution-challenge-v1 | `52b18106a2473d2001168069795c716fd8827fff8430ebf6e89f9986e382f4c7` |
| text-review-workflow-example | `1f959f4ea2a74abf353edd5edae787578f233095ea0f93d52719b647d3a4a9e9` |

Both engines report core `0.2.0`. Observed baseline version:

`{"native_content": "native-content-heuristic-v2.evidence-v1"}`

Observed opt-in candidate version:

`{"contextual_content": "contextual-attribution-v1"}`

The candidate remains opt-in; default `analyze()` remains unconfigured.

## Overall development confusion

| Dataset / analyzer | Assessed cases | TP | TN | FP | FN | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| native-text-diagnostic-v1 / baseline | 32 | 13 | 7 | 5 | 7 | 72.22% | 65.00% |
| native-text-diagnostic-v1 / candidate | 32 | 13 | 12 | 0 | 7 | 100.00% | 65.00% |
| context-attribution-challenge-v1 / baseline | 35 | 19 | 0 | 16 | 0 | 54.29% | 100.00% |
| context-attribution-challenge-v1 / candidate | 35 | 19 | 14 | 2 | 0 | 90.48% | 100.00% |

Precision/recall percentages are rounded; confusion counts are exact. Positive means
score > 0, using the original diagnostic rule, not a production decision threshold.

## Per-category development results

| Dataset / category / analyzer | TP | TN | FP | FN | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| native-text-diagnostic-v1 / toxicity / baseline | 13 | 7 | 5 | 7 | 72.22% | 65.00% |
| native-text-diagnostic-v1 / toxicity / candidate | 13 | 12 | 0 | 7 | 100.00% | 65.00% |
| native-text-diagnostic-v1 / harassment / baseline | 13 | 7 | 5 | 7 | 72.22% | 65.00% |
| native-text-diagnostic-v1 / harassment / candidate | 13 | 12 | 0 | 7 | 100.00% | 65.00% |
| native-text-diagnostic-v1 / hate / baseline | 3 | 26 | 1 | 2 | 75.00% | 60.00% |
| native-text-diagnostic-v1 / hate / candidate | 3 | 27 | 0 | 2 | 100.00% | 60.00% |
| native-text-diagnostic-v1 / threat / baseline | 3 | 26 | 1 | 2 | 75.00% | 60.00% |
| native-text-diagnostic-v1 / threat / candidate | 3 | 27 | 0 | 2 | 100.00% | 60.00% |
| native-text-diagnostic-v1 / sexual_risk / baseline | 3 | 28 | 0 | 1 | 100.00% | 75.00% |
| native-text-diagnostic-v1 / sexual_risk / candidate | 3 | 28 | 0 | 1 | 100.00% | 75.00% |
| context-attribution-challenge-v1 / toxicity / baseline | 19 | 0 | 16 | 0 | 54.29% | 100.00% |
| context-attribution-challenge-v1 / toxicity / candidate | 19 | 14 | 2 | 0 | 90.48% | 100.00% |
| context-attribution-challenge-v1 / harassment / baseline | 19 | 0 | 16 | 0 | 54.29% | 100.00% |
| context-attribution-challenge-v1 / harassment / candidate | 19 | 14 | 2 | 0 | 90.48% | 100.00% |
| context-attribution-challenge-v1 / hate / baseline | 4 | 30 | 1 | 0 | 80.00% | 100.00% |
| context-attribution-challenge-v1 / hate / candidate | 4 | 31 | 0 | 0 | 100.00% | 100.00% |
| context-attribution-challenge-v1 / threat / baseline | 5 | 28 | 2 | 0 | 71.43% | 100.00% |
| context-attribution-challenge-v1 / threat / candidate | 5 | 30 | 0 | 0 | 100.00% | 100.00% |
| context-attribution-challenge-v1 / sexual_risk / baseline | 4 | 30 | 1 | 0 | 80.00% | 100.00% |
| context-attribution-challenge-v1 / sexual_risk / candidate | 4 | 31 | 0 | 0 | 100.00% | 100.00% |

## Reporting, criticism, author abuse and evasion slices

| Dataset / original group | Cases | Baseline FP / FN | Candidate FP / FN |
| --- | ---: | ---: | ---: |
| native-text-diagnostic-v1 / benign | 4 | 0 / 0 | 0 / 0 |
| native-text-diagnostic-v1 / criticism | 4 | 2 / 0 | 0 / 0 |
| native-text-diagnostic-v1 / quoted_reporting | 4 | 3 / 0 | 0 / 0 |
| native-text-diagnostic-v1 / harassment | 4 | 0 / 0 | 0 / 0 |
| native-text-diagnostic-v1 / threat | 4 | 0 / 1 | 0 / 1 |
| native-text-diagnostic-v1 / hate | 4 | 0 / 2 | 0 / 2 |
| native-text-diagnostic-v1 / sexual_risk | 4 | 0 / 1 | 0 / 1 |
| native-text-diagnostic-v1 / evasion | 4 | 0 / 3 | 0 / 3 |
| context-attribution-challenge-v1 / reporting | 8 | 8 / 0 | 2 / 0 |
| context-attribution-challenge-v1 / criticism | 8 | 8 / 0 | 0 / 0 |
| context-attribution-challenge-v1 / endorsed | 7 | 0 / 0 | 0 / 0 |
| context-attribution-challenge-v1 / mixed | 4 | 0 / 0 | 0 / 0 |
| context-attribution-challenge-v1 / direct | 4 | 0 / 0 | 0 / 0 |
| context-attribution-challenge-v1 / ambiguous | 4 | 0 / 0 | 0 / 0 |

Per-category FP/FN case IDs and mutually assessed improvements/regressions are in
the JSON report. Groups and overlapping tags are not pooled into independent totals.
The candidate fixes five overall false positives on the 32-case set and fourteen on
the challenge, with no new overall FP/FN on these exposed sets. This is development
behavior, not independent evidence of generalization.

## Coverage and witness audit

| Dataset | Baseline witnesses checked / invalid | Candidate witnesses checked / invalid |
| --- | ---: | ---: |
| native-text-diagnostic-v1 | 51 / 0 | 37 / 0 |
| context-attribution-challenge-v1 | 90 / 0 | 61 / 0 |
| text-review-workflow-example | 2 / 0 | 2 / 0 |

All returned witnesses pass source-field, nonempty, bounds and UTF-16 checks.
This is structural correctness, not semantic attribution accuracy. The original
32/35-case sets have **no gold span annotations**; semantic annotation precision/
recall are `null`, not 100%. The workflow example has two provisional expected spans
in one known warning/parent probe: both analyzers align both witnesses (2/2). Those
same-author development annotations are not an independent evidence review.

The seven-case workflow example includes **4 completed, 1 partial, 2 unsupported**
results for each analyzer. Only four whole cases enter overall confusion; the partial
case contributes its assessed harassment label only. French and native profanity/
spam-scam requests have no quality score; unsupported labels never become TNs.
Exact `und` execution is covered without claiming language detection. Both analyzers
still implement only their existing five categories and exact en/und hints.

The reused implied-threat probe is a false negative for both analyzers under unchanged
positive labels. It is deliberately exposed development material and is never counted
as independent held-out validation. Each report remains separate from the other sets.

## Remaining quality gaps and next bounded PR

- Actual independent review, separately collected/frozen held-out data, representative
  sampling, subgroup/error budgets and calibration remain NOT_RUN.
- Native misses implied threats, obfuscation, discriminatory exclusion and unlisted
  sexual requests. The candidate retains those misses and still flags unquoted
  victim reporting (`reporting-7`) and malformed quotes (`reporting-8`).
- Endorsement, ambiguous product/person nouns, nonlocal/multiline/nested quotations,
  and evidence attribution need independent category/span adjudication.
- Overlap checks catch normalized main-text duplicates only. Review declarations do
  not verify identity, rights, hidden development exposure or paraphrase leakage.

Recommended next PR: onboard a small owner-approved independently labeled corpus
with frozen reviewed/held-out splits, reviewer aliases/records, explicit category and
attribution guidelines, permission evidence, all exposed development references and
targeted reporting/criticism/implied-threat/evasion slices. Store the nonpublic corpus
and raw reports outside Git. Run both unchanged analyzers before proposing one
separate heuristic change. No automatic promotion, Flaggr work, release or deployment.

## Verification

Final local verification on Node **22.22.2** / npm **10.9.7**:

| Command/check | Result |
| --- | --- |
| `npm ci` | PASS, exit 0 |
| `npm run check` | PASS, exit 0; **219/219** tests, source/examples typecheck, build, all four examples and all evaluations |
| `npm run eval:all` | PASS, exit 0, including the review workflow |
| Focused new evaluation tests with Node built-in coverage | PASS, **40/40**, exit 0 |
| `npm pack --dry-run --json` | PASS, exit 0; 65 files, no evaluation datasets/tests, `.local` or private reports |
| Library source/analyzers/public schemas/original datasets/dependency lock against main | Unchanged |

Focused coverage from `node --experimental-test-coverage --test tests/review-dataset.test.mjs tests/review-evaluation.test.mjs`:

| New evaluation module | Lines | Branches | Functions |
| --- | ---: | ---: | ---: |
| `evaluate-reviewed.mjs` | 100.00% | 98.60% | 97.92% |
| `review-dataset.mjs` | 100.00% | 89.74% | 100.00% |
| `run-review.mjs` | 100.00% | 69.23% | 100.00% |

These are focused JavaScript test-coverage figures, not full-package coverage or
semantic accuracy. All files loaded by that focused run measured 94.31% lines /
86.85% branches / 97.79% functions; rare CLI/I/O branches remain unexercised.
The original 179 tests are preserved, with 40 new regression cases. The first focused
draft run failed 1/36 on an incorrect new-test assumption about the parent witness:
the frozen analyzer returns `hurt` at UTF-16 [10,14), not the full parent phrase.
Only that test expectation was corrected; source labels/annotations/scoring were not.
Final runs have no test or harness failure. Raw baseline/final logs are ignored under
`.local/t3/`; source hashes and deterministic metrics remain reproducible.

Independent human label/span review, held-out quality, calibration, Node 24 locally,
Flaggr integration, production moderation, deployment and publication are **NOT_RUN**.
Existing CI runs the check on Node 22/24; its remote outcome must be reported separately.
