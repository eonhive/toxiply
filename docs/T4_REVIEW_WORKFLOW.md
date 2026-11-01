<!--
Company: EonHive Inc. | Title: T4 review workflow verification
Purpose: Record scope, regression evidence and remaining independent evaluation gates.
Author: Stan Nesi | Created: 2026-11-01 | Updated: 2026-11-01
Notes: Vibe coded with Codex.
-->
# Phase T4: offline annotation handoff

Base: `49ada64`, merged Phase T3 PR #6. The user selected **build review workflow;
keep labels provisional**. The repository has no approved corpus/reviewer on record.
This phase implements the handoff prerequisite, not an independently reviewed corpus.

The [review workflow and draft guidance](TEXT_ANNOTATION_REVIEW.md) add deterministic
prediction-free packets, deliberately incomplete response templates, hash-bound response
reconciliation, immutable private revisions and change receipts. Dataset split, text,
context, provenance and category requests are retained. Old labels/spans are never
silently carried into a claimed human review, and exposed data is never promoted to
held-out. Source analyzers, public 0.2.0 contracts/exports, five native categories, opt-in
candidate, confidence metadata, original datasets and dependencies are unchanged.

## Baseline and validation

Baseline `npm ci` and `npm run check` PASS on Node 22.22.2 / npm 10.9.7: 219 tests,
source/example typecheck, build, all four examples and `eval:all`. No baseline failure
was observed. The first focused draft run passes 56/56 dataset and handoff tests.

Final local checks on the same Node/npm versions:

| Check | Result |
| --- | --- |
| `npm ci` | PASS, exit 0; 0 reported vulnerabilities |
| `npm run check` | PASS, exit 0; 249/249 tests (30 new), source/example typecheck, build, four examples and all evaluations |
| `npm run eval:all` | PASS, exit 0; explicit rerun of lexical/native/paired/review suites |
| Focused dataset/handoff tests with built-in coverage | PASS, exit 0; 56/56, no skipped tests |
| CLI prepare/template/blank-rejection smoke check | PASS; seven exact request/context cases, null labels, unfilled response rejected |
| Public paired report compared to saved T3 report | PASS; byte-identical, including per-category metrics, coverage, spans, versions and hashes |
| `npm pack --dry-run --json` | PASS; 65 files, no evaluation/test/private artifacts; nothing published |
| Compatibility diff / whitespace / local Markdown links | PASS; source/schemas/package metadata/original data unchanged, clean diff, 43 links resolve |

Focused coverage (dataset/handoff tests only, not full-library coverage):

| Module | Lines | Branches | Functions |
| --- | ---: | ---: | ---: |
| `eval/review-packet.mjs` | 100.00% | 100.00% | 100.00% |
| `eval/review-dataset.mjs` | 100.00% | 93.26% | 100.00% |
| `eval/run-review.mjs` | 100.00% | 69.23% | 100.00% |
| All three included modules | 100.00% | 92.96% | 100.00% |

No command/test failure occurred in these runs. CLI branch coverage remains limited;
coverage percentages do not establish semantic annotation or analyzer accuracy. Local
logs, packet/template smoke artifacts, raw public comparison and package preview are
ignored under `.local/t4/`; fictional reviewed datasets exist only in temporary tests.
CI remains the existing Node 22/24 matrix; its actual PR outcome is reported separately.

The [T3 public comparison](T3_BASELINE.md) remains the quality baseline. All labels are
provisional development evidence. No quality improvement follows from workflow code.
Frozen native 32-case results remain baseline TP 13/TN 7/FP 5/FN 7 and candidate
TP 13/TN 12/FP 0/FN 7; attribution challenge 35-case results remain baseline
19/0/16/0 and candidate 19/14/2/0 (TP/TN/FP/FN). The separate 36-case literal
diagnostic remains 14/10/0/12.
Exact hashes and per-category metrics are in the unchanged T3 report.

## Limits and next bounded implementation

Actual independent annotation, owner-approved collection, held-out evaluation and
calibration remain **NOT_RUN**. Metadata is an attestation, not identity/rights/independence
verification. Packets omit prior labels/predictions but cannot erase public exposure,
identify embedded personal data or guarantee blinding. The draft guide requires
owner/reviewer agreement; no production taxonomy is asserted. No heuristic, capability,
source integration, publishing, license, visibility, deployment or Flaggr change is
included. Native implied-threat/evasion misses and contextual unquoted/malformed-report
false positives remain known quality gaps.

Next bounded PR: use an approved independently collected corpus and actual reviewer
records with an agreed guide revision, frozen split/permission records and all known
development references. Keep nonpublic inputs, packets, submissions and raw reports
outside Git; publish only owner-approved aggregates. Measure both unchanged analyzers
before scoping a single independently justified heuristic experiment. Until those inputs
exist, keep labels provisional and the candidate opt-in.

Rollback: revert this workflow PR to remove repository-only handoff commands/docs.
Library behavior and original datasets are unchanged; retain local source/packet/response
and revision artifacts for provenance rather than deleting or rewriting them.
