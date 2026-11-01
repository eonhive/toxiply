<!--
Company: EonHive Inc. | Title: T5 independent validation readiness
Purpose: Audit existing tools, define corpus onboarding gates and record actual verification.
Author: Stan Nesi | Created: 2026-11-01 | Updated: 2026-11-01
Notes: Vibe coded with Codex.
-->
# Phase T5: independent text quality validation readiness

Base: merged T4 PR #7, `ba8d08bdddc4dea1d7309a297db973eb25a5ab05`.
Outcome: **preparation complete; independent quality validation NOT_RUN**.
No approved corpus, permission records or actual independent reviewer were supplied.
The examined repository/docs, designated `.local/datasets` / `.local/review` locations
and open repository issues contain no onboarding records. This is an availability
finding for this task, not a claim that no suitable data exists elsewhere. No arbitrary
private folders, Flaggr data or customer sources were searched or imported.

## Exact missing inputs

| Required input | Readiness / evidence needed to proceed |
| --- | --- |
| Owner-approved source | NOT_SUPPLIED: source/version/location, owner approval, collection and sampling record |
| Usage rights | NOT_SUPPLIED: permission/terms evidence covering processing, human access, retention and any permitted aggregate disclosure |
| Private corpus storage | NOT_SUPPLIED: approved location/access list and retention/contact records; ignored directories alone do not establish approval |
| Independent reviewer | NOT_SUPPLIED: actual human, private identity-to-alias record, language competence and non-involvement in either analyzer/dataset development |
| Agreed label definition | PENDING: owner/reviewer agreement on draft guide 1.0.0, category overlap, attribution, ambiguity and span instructions |
| Reviewed annotations | NOT_SUPPLIED: completed labels/rationales, source-relative spans where audited, review timestamps and independent-review records |
| Development / held-out manifests | NOT_SUPPLIED: separately collected held-out material, freeze/exposure records, version/hash manifests and all known reference data |

No names, permissions, labels or review dates are invented to fill these gaps. Existing
committed labels remain provisional. Human-reviewed/held-out import and comparison are
NOT_RUN; only public synthetic diagnostics were rerun. No source, schema, dependency,
analyzer version, default or Flaggr behavior changes are made in this preparation PR.

## Existing workflow audit

| Already implemented | Remaining human/process responsibility |
| --- | --- |
| `review-dataset.mjs`: strict V1 identity/provenance/labels/review/span validation | Verify actual rights, reviewer identity/independence and the intended annotation meaning |
| Held-out declaration, freeze metadata and normalized main-text/reference overlap checks | Freeze separately collected data; check all known sources, context, paraphrases, duplicates and prior exposure |
| Immutable private imports (`0600`, exclusive creation, resolved Git/path checks) | Approve storage, restrict directory/backups/access, retain originals and keep manually redirected reports private |
| T4 opaque-ID packets and blank response templates | Inspect content/label definition for bias/identity disclosure; conduct real review without predictions |
| Hash-bound responses, new-version revisions and label-change receipts | Retain source/packet/submission/receipt/permission/guidance records; independently resolve ambiguity |
| Paired native/contextual metrics, FP/FN IDs, slices, coverage and structural/annotated span audits | Assess annotation validity, representativeness, semantic attribution and whether findings justify an experiment |

The tools already work; no duplicate validator/importer, new manifest schema or review
service is needed. Tests exercise metadata declarations with fictional reviewers;
those files are not independent evaluation evidence. One response represents one
submitted reviewer; consensus/adjudication and external identity verification are manual.

Important limits:

- V1 requires complete boolean labels. `held_out` and `human_reviewed` require completed
  review declarations. Packet preparation cannot ingest a raw unlabeled collection or
  a pending-review held-out V1 file. Do not insert fake labels or mark review complete
  to get past validation; use the initial-annotation procedure below.
- Reconciliation preserves the input split. Actual review of exposed development data
  leaves it development; no automatic held-out promotion exists.
- The CLI automatically supplies three native/V1 development references. Its parser
  does not accept the separate lexical-profanity dataset format. Include that exposed
  36-case diagnostic in the maintainer's separate leakage audit without reinterpreting
  its surface-presence labels as native harm labels. Other incompatible/private sources
  also need an explicit audit record; do not assert that CLI success checked them.
- Automated overlap checks cover normalized main text only, not paraphrase or context
  leakage. Metadata and hashes cannot establish truthful freeze dates or independence.
- Structural span validity is not semantic accuracy. Missing annotations produce null
  semantic metrics; empty spans cannot certify correct attribution. No timing benchmark
  or production calibration is provided by the existing paired quality runner.

## Corpus onboarding procedure (using existing tools)

1. **Approve before access.** The owner identifies the exact source/revision and records
   permission/terms, permitted purposes, reviewer access, retention and public-disclosure
   limits privately. Do not treat public availability as permission or import customer
   content from Flaggr. No source is approved by this document.
2. **Freeze collection and splits.** Record source-byte hashes and sampling/exclusion
   criteria before looking at model output. Keep exposed development data separate from
   a separately collected held-out source. Freeze original inputs, split membership,
   timestamps, custodian and prior-access records in private manifests. Do not make a
   held-out set by splitting/relabeling the existing synthetic diagnostics. If exposure
   compromises a split, record it and collect a new eligible version.
3. **Agree on guidance and reviewer.** Use [draft guidance 1.0.0](TEXT_ANNOTATION_REVIEW.md#draft-annotation-guidance-100)
   with an owner/reviewer-approved supplement/hash. Resolve category overlap, implied
   threats, reported versus endorsed speech, product/person ambiguity and uncertainty.
   Record half-open UTF-16 span/source conventions, qualified language coverage and
   private reviewer identity/alias/independence. Do not tune labels from predictions.
4. **Perform initial annotation truthfully.** For raw unlabeled data, an independent
   human annotates the frozen inputs through an approved manual/offline channel before
   a maintainer assembles V1. Preserve original human submissions and their hashes.
   Create `human_reviewed` / `held_out` V1 only after actual review, preserving the
   predeclared source/split and recording real review/freeze metadata. Never create a
   provisional development copy of a held-out source for analyzer experimentation.
   For an already labeled provisional V1 development dataset, use existing
   `prepare-review`, `review-template` and `apply-review` as documented in T4; keep the
   original, use a separate response/new version and retain the reconciliation receipt.
   Escalate unresolved labels privately; null is not a negative and cannot pass import.
5. **Freeze references and validate.** Retain a manifest of this repository revision,
   all exposed native/attribution/lexical probes, approved external/private development
   sources and reviewed comparison corpora with original byte hashes. Complete the
   manual leakage audit above. Supply every compatible extra reference to the existing
   CLI with repeated `--reference FILE`; references must not include the held-out file
   itself. Validate each split independently, and investigate rejected overlap rather
   than silently discarding difficult cases.
6. **Import and compare immutably.** Use existing commands below; retain source hashes,
   split manifests, reviewer submissions, T4 audit receipts where applicable, validation
   receipts and raw comparison reports together. Choose unique output/report names.
   Neither shell redirection nor an ignored directory establishes access control.
7. **Review results before improvement.** Report each dataset/split separately, with
   category TP/TN/FP/FN, precision/recall and denominators, FP/FN IDs, attribution slices,
   statuses/missing coverage, source/semantic-span audits, hashes and analyzer versions.
   Assess both unchanged analyzers against the same eligible labels. Label development
   observations explicitly; disclose sampling/annotation limits. Freeze results before
   proposing an experiment; opening held-out errors for tuning consumes that holdout
   for future changes. Public aggregates require owner approval. Keep candidate opt-in.

After approval and completed real annotation, run on each eligible V1 split:

```sh
npm ci
npm run build
mkdir -p .local/datasets .local/reports
node eval/run-review.mjs validate /absolute/path/to/approved-reviewed-v1.json \
  --reference /absolute/path/to/frozen-development-v1.json \
  > .local/reports/validation-new-version.json
node eval/run-review.mjs import /absolute/path/to/approved-reviewed-v1.json .local/datasets \
  --reference /absolute/path/to/frozen-development-v1.json \
  > .local/reports/import-new-version.json
node eval/run-review.mjs compare .local/datasets/corpus-id@new-version.json \
  --reference /absolute/path/to/frozen-development-v1.json \
  > .local/reports/comparison-new-version.json
```

Paths/names above are placeholders, not a supplied corpus. Repeat references as needed;
add the reviewed corpus when testing a separate held-out split. Existing V1 format and
[T4 handoff](TEXT_ANNOTATION_REVIEW.md) remain canonical. No new generator or label format
is introduced. Keep nonpublic source texts, packets, receipts and raw reports outside
Git; a public PR contains only explicitly approved aggregates and generic procedures.

## Measured development results (not independent validation)

The fresh paired JSON is byte-identical to the saved T4 report, SHA-256
`94d8fbca3bda26c2b1b76f5fea72cda761f8d8e5c5cc81ae9cc9cc438515d743`.
Dataset hashes, analyzer versions, per-category precision/recall and confusion counts
match [T3 baseline](T3_BASELINE.md). Native version remains
`native-content-heuristic-v2.evidence-v1`; candidate remains `contextual-attribution-v1`;
engine/package remains 0.2.0. These are exposed synthetic data, not approved human labels.

| Dataset | Native TP/TN/FP/FN | Candidate TP/TN/FP/FN | Precision native/candidate | Recall native/candidate |
| --- | --- | --- | --- | --- |
| Native diagnostic, 32 cases | 13/7/5/7 | 13/12/0/7 | 72.22% / 100% | 65% / 65% |
| Attribution challenge, 35 cases | 19/0/16/0 | 19/14/2/0 | 54.29% / 90.48% | 100% / 100% |

| Category | Native-32 baseline FP/FN | Native-32 candidate FP/FN | Challenge-35 baseline FP/FN | Challenge-35 candidate FP/FN |
| --- | --- | --- | --- | --- |
| toxicity | 5/7 | 0/7 | 16/0 | 2/0 |
| harassment | 5/7 | 0/7 | 16/0 | 2/0 |
| hate | 1/2 | 0/2 | 1/0 | 0/0 |
| threat | 1/2 | 0/2 | 2/0 | 0/0 |
| sexual_risk | 0/1 | 0/1 | 1/0 | 0/0 |

Native attribution errors include `criticism-1/2` and `report-1/2/3`. Candidate retains
`reporting-7` (unquoted victim report) and `reporting-8` (malformed quotation) false
positives in toxicity/harassment. Native-32 misses remain `threat-4`, `hate-3/4`,
`sexual-4`, `evasion-1/2/3`; both models retain these overall misses. Candidate fixes
5 and 14 overall FPs respectively, with 12/32 category-label improvements and zero
new overall FP/FN or category regressions on these two development sets only.

Structural witnesses checked/invalid: native-32 51/0 baseline and 37/0 candidate;
challenge-35 90/0 and 61/0. Both sets lack gold spans, so semantic accuracy is unmeasured.
The seven-case workflow probe has 4 completed, 1 partial, 2 unsupported per analyzer;
only four whole cases score (1 TP/2 TN/0 FP/1 FN). Its two provisional expected spans
align 2/2 for each analyzer, not independently adjudicated accuracy. French and native
profanity/spam remain unassessed; exact `und` execution is not language detection.
The separate literal 36-case diagnostic remains 14/10/0/12 with different label meaning.
Quality differences above are predictive diagnostics; runtime-speed differences were
NOT_RUN. Scores remain uncalibrated and no safe-action threshold is inferred.

## One targeted improvement proposal — not implemented

Investigate only **local unquoted third-party victim-report attribution** in a future
separately versioned contextual candidate. Measured motivation: `reporting-7` still
flags toxicity/harassment for a reported insult, despite its provisional non-endorsement
label. An experiment could recognize a bounded explicit third-party reporting frame
and exclude only that reported insult while preserving independent current-author harm.

This is a hypothesis from development evidence. Require independently reviewed contrast
cases before implementing: victim reports, current-author insults, self-attributed speech,
explicit endorsement, mixed independent abuse and ambiguous/nonlocal frames. Limit any
grammar to those reviewed forms, retain offset mapping and conservative ambiguity
handling, and report all category/evidence regressions on frozen references. Success
requires a measured reduction in eligible reporting FPs with no observed new FN/category
regressions in those reviewed contrast cases; it does not establish generalization.
Leave malformed quotes, evasion and implied-threat expansion outside that one experiment.
Do not change native rules or promote the candidate. No expected gain is claimed here.

## Exact verification

Node 22.22.2 / npm 10.9.7, on the unchanged merged baseline:

| Check | Actual result |
| --- | --- |
| `npm ci` | PASS, exit 0; 0 reported vulnerabilities |
| `npm run check` | PASS, exit 0; 249/249 existing tests, typecheck/build, four examples, full public evaluations |
| `npm run eval:all` | PASS, exit 0; explicit lexical/native/paired/review run |
| Existing review dataset/packet/evaluator tests with Node coverage | PASS, exit 0; 70/70, no skips |
| Paired report / `npm pack --dry-run --json` | PASS; byte-identical to T4 / 65 files, no publication |
| Source/data compatibility diff, whitespace, local doc targets/anchor | PASS; runtime/eval/test/package files unchanged, clean diff, 33 links resolve |
| Independent review/import/held-out comparison | NOT_RUN; exact missing inputs listed above |
| Private legacy rerun / Flaggr workflow parity / latency / calibration | NOT_RUN; no new eligible inputs or integration scope |

Focused coverage only: evaluator 100% lines / 98.60% branches / 97.92% functions;
dataset 100/93.26/100; packet 100/100/100; CLI 100/69.23/100. Across the four included
modules: 100% lines, 95.79% branches, 98.91% functions. These are test coverage, not
semantic accuracy. No new tests are added for this documentation-only change; the
existing 70 review regressions supply the audit evidence. Local logs, coverage and raw
public comparison remain ignored under `.local/t5/`. CI uses the unchanged Node22/24
matrix; the PR records its actual outcome separately. No merge or publication is run.

Stop here until real corpus/reviewer/rights/freeze records are provided. The next bounded
PR imports eligible reviewed data and reports both unchanged analyzers; the single
heuristic proposal above requires its own later implementation decision. Rollback is
reverting these preparation docs; preserve all existing tools, data and local records.
