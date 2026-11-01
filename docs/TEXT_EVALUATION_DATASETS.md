<!--
Company: EonHive Inc. | Title: Versioned text evaluation datasets
Purpose: Specify review declarations, held-out separation and private import workflow.
Author: Stan Nesi | Created: 2026-10-31 | Updated: 2026-10-31
Notes: Vibe coded with Codex.
-->
# Text evaluation datasets: toxiply.text-eval.v1

This is a repository evaluation format, separate from the unchanged public analysis
schema. Its validator is [review-dataset.mjs](../eval/review-dataset.mjs). A complete
[development example](../eval/text-review.example.v1.json) is executable and deliberately
**provisional**. No independently reviewed or held-out corpus ships in this PR.

## Required fields

| Field | Meaning |
| --- | --- |
| `schemaVersion` | Exactly `toxiply.text-eval.v1` |
| `datasetId`, `datasetVersion` | Stable identity and immutable version identifiers, using lowercase letters, digits, `.`, `_`, `-`; bump version for input/label/review changes |
| `taxonomyVersion` | Exactly `toxiply.categories.v1` |
| `labelDefinition` | Explicit annotation meaning/guideline reference; do not compare different definitions as equivalent quality |
| `split` | `development`, `human_reviewed`, or `held_out` |
| `reviewStatus` | `provisional` or `human_reviewed`, consistent with every case's review state |
| `provenance` | `source`, `sourceKind`, `rights`, `visibility`, `authors` |
| `cases` | 1–10,000 cases with unique IDs |

Provenance `sourceKind` is `synthetic_development` or `independent_collection`.
`source` records collection/source and sampling details; `rights` records the owner's
permission or applicable terms, not an assumed license. `visibility` is `public` or
`private`. Author/reviewer identifiers should be opaque aliases rather than customer
identities. These strings are declarations, not automatically verified rights evidence.

Each case contains:

- `id`, `group`, and `tags`: reviewable grouping, not classifier predictions. Tags may
  include `quoted_reporting`, `product_criticism`, `personal_abuse`, `threat`,
  `implied_threat`, `evasion` and coverage probes. Groups/slices are reported separately;
  overlapping tags must not be added together as disjoint totals.
- `request`: an unchanged public V1 text request, including its schema, content,
  requested categories and optional bounded context. `requestId` must equal case `id`.
- `labels`: **one explicit boolean per requested category**, with no extras. `true`
  means present under `labelDefinition`; `false` means absent. Missing labels are
  rejected rather than treated as negative. Unsupported categories may still be
  labeled, but unassessed labels never enter confusion denominators.
- `rationale`: the annotation reason, independent of an analyzer's output.
- `review`: either `{ "status": "provisional" }` or a human-review declaration below.
- Optional `evidenceSpans`: `{ category, source, start, end }` annotations for positive
  labels. Sources are `text`, `parentText`, `quotedText`; offsets are half-open UTF-16
  indices into original request fields. Empty, absent-source, out-of-bounds, negative
  category and split-surrogate annotations are rejected. An annotation represents
  an expected span containing the relevant witness, not a requirement for an analyzer
  to report every possible occurrence.

The existing core validator enforces request bounds and controlled categories/context.
Unknown fields, duplicate IDs/tags, missing labels and inconsistent review declarations
fail validation. JSON files must be valid UTF-8. The importer preserves bytes and hash;
it does not normalize text, rewrite labels or update review status.

## Review and separation gates

An actual independent reviewer records:

```json
{
  "status": "human_reviewed",
  "reviewer": "approved-reviewer-alias",
  "reviewedAt": "2026-10-31T12:00:00.000Z",
  "independentOfDevelopment": true
}
```

The reviewer cannot be a declared dataset author. `human_reviewed` and `held_out`
splits require all cases to have complete human-review declarations; dataset
`reviewStatus` must agree. Synthetic cases may receive actual independent human label
review, but that does **not** make them held-out. A held-out dataset additionally needs
`sourceKind: independent_collection` and:

```json
{ "holdout": { "frozenAt": "2026-10-31T11:00:00.000Z", "notUsedForDevelopment": true } }
```

Schema checks cannot establish reviewer identity, truthfulness, legal rights or an
absence of development exposure. A maintainer must inspect actual source permission,
review records, sampling and freeze controls. Do not fill these fields with invented
reviewers or promote development material through a rename/random split. Test-only
review declarations exercise the validator and are not real evaluation evidence.

Held-out validation requires development reference datasets and rejects overlap in
NFKC-normalized, lowercased, whitespace-normalized main text, ignoring IDs and labels.
It also rejects duplicate held-out text. The CLI always supplies all three bundled
development datasets and accepts additional `--reference FILE` inputs. Reference file
hashes are recorded. This conservative check may reject valid repeated-context probes;
it does not detect paraphrases, context-only leakage, unknown/private training data,
or prove semantic independence. Supply all known exposed/private development data
and the reviewed corpus as references; keep split manifests and outputs private.

## Local validation and immutable import

```sh
npm ci
npm run build
mkdir -p .local/datasets .local/reports
node eval/run-review.mjs validate /absolute/path/to/approved-reviewed.json
node eval/run-review.mjs import /absolute/path/to/approved-reviewed.json .local/datasets
node eval/run-review.mjs compare .local/datasets/corpus-id@1.0.0.json \
  --reference /absolute/path/to/known-development.json \
  > .local/reports/reviewed-comparison.json
```

The import directory must already exist. Imports write `datasetId@datasetVersion.json`
exclusively with mode `0600`, refusing overwrites. Inside this repository only ignored
`.local/` is accepted. Symlinks are resolved; another Git repository is rejected.
External destinations must be approved private locations outside Git. Files already
copied manually elsewhere remain the maintainer's responsibility. No registry, database,
network service, upload, label generator or automated human review is introduced.

`npm run dataset:validate -- FILE`, `npm run dataset:import -- FILE DIRECTORY`, and
`npm run eval:review -- FILE` are convenience wrappers that also build. For machine
JSON redirects use `node` after building, because npm wrapper output includes logs.
The validator prints manifest metadata only. Comparison reports include case IDs,
labels, scores, evidence coordinates and provenance, so nonpublic reports must remain
ignored/private even though raw request text is not echoed. Failure output uses
bounded codes/paths without input or exception text.

## Metrics and evidence interpretation

`eval:review` compares native and contextual analyzers independently on each input.
Category-positive means score **greater than zero**, the existing diagnostic rule;
these are uncalibrated signals, not probabilities or action thresholds. Overall
confusion counts require the entire category/context request to be assessed. Partial
results contribute only assessed category labels; unsupported semantic context excludes
all category scores from quality metrics. Unsupported/failed/invalid results never
become successful negatives. Denominators, unassessed counts, status, missing
capabilities, language coverage, per-category FP/FN IDs and version records are explicit.
Undefined rates are `null`.

Paired fixes/regressions use only category intersections and whole cases assessed by
both engines. Execution failures and malformed/source-invalid results make the CLI
return nonzero while preserving the diagnostic report. Mixed analyzer versions abort
evaluation. Expected partial/unsupported capability probes remain successful harness
executions with explicit gaps. Old frozen diagnostic commands retain their stricter
complete-coverage behavior and unchanged labels.

Structural span validity checks original fields, bounds, nonempty slices and UTF-16
boundaries. It is **not** a semantic correctness score. Optional annotations enable
category-specific witness containment precision and annotated-span recall, under the
declared label-review status. Categories without annotations have no semantic span
metric; unassessed annotations are reported separately. Current public annotations
are only provisional development probes, not an independent evidence audit.

Legacy `toxiply.native-eval.v1` inputs are validated by their existing parser and
mapped in memory to provisional development metadata with version `legacy-v1`.
Text, labels, context and original file hash are retained. Unrecorded authorship/rights
are identified explicitly and visibility defaults to private; import requires the
new explicit format. Neither legacy schema nor files are rewritten.
