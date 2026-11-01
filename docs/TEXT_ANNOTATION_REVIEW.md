<!--
Company: EonHive Inc. | Title: Offline text annotation review
Purpose: Specify prediction-free handoff, versioned draft guidance and auditable revisions.
Author: Stan Nesi | Created: 2026-11-01 | Updated: 2026-11-01
Notes: Vibe coded with Codex.
-->
# Offline text annotation review

Phase T4 provides an offline handoff for actual human annotation using existing
`toxiply.text-eval.v1` datasets. The user chose to **keep labels provisional** for this
PR. No reviewer, reviewed corpus, held-out result or quality improvement is fabricated.
This is repository evaluation tooling, separate from the unchanged 0.2.0 library.

## Maintainer preparation

Confirm permission, sampling, reviewer identity and independence outside Git. Retain
records in an approved private location. The reviewer must not be a declared dataset
author or a developer of either analyzer. Review source text and `labelDefinition` for
identity disclosure or label/prediction hints before handoff; opaque case IDs do not
anonymize content. Do not send anything externally without permission. These commands
read/write local files and never send messages.

Input must use the explicit [versioned dataset format](TEXT_EVALUATION_DATASETS.md).
Legacy diagnostics lack rights/author records and are rejected here; a maintainer must
record truthful provenance in a new V1 manifest before review. Original files remain
unchanged. This workflow does not ingest an unlabeled collection, select/split cases,
establish publication rights or adjudicate multiple reviewers. Do not manufacture
starter labels for an unapproved corpus.

## Handoff and reconciliation

After `npm ci` and `npm run build`:

```sh
mkdir -p .local/review .local/datasets .local/reports

# Safe demonstration: seven exposed provisional schema probes; no human review.
node eval/run-review.mjs prepare-review eval/text-review.example.v1.json .local/review

# Use the destination printed above; this prints the blank template's destination.
node eval/run-review.mjs review-template /absolute/path/to/printed-packet.json .local/review
```

Keep the source dataset, packet and blank template intact. Give an approved reviewer
only the packet, template and agreed guidance. The reviewer fills a separate private
copy. Do not supply analyzer output, old labels/rationales or a comparison report.
Blank/null labels and review declarations are deliberately invalid. Do not fill them
as a demonstration and claim the result is reviewed evidence.

Once a human actually submits a response and a maintainer checks the review records:

```sh
node eval/run-review.mjs apply-review /absolute/path/to/original-dataset.json \
  /absolute/path/to/printed-packet.json /absolute/path/to/submitted-response.json \
  .local/datasets --reference /absolute/path/to/known-development.json \
  > .local/reports/review-audit.json

# Use the NEW dataset path printed in the audit receipt.
node eval/run-review.mjs compare .local/datasets/corpus-id@reviewed-version.json \
  --reference /absolute/path/to/known-development.json \
  > .local/reports/reviewed-comparison.json
```

Artifact destinations use the existing immutable private-import rules: an existing
ignored `.local/` or approved external directory outside Git, exclusive creation and
mode `0600`. Public source directories, symlink escapes into them, another Git repository
and overwrites are rejected. Redirected receipts/reports are the maintainer's responsibility:
use new filenames for each revision and keep them ignored/private. Receipts contain old
labels and original case IDs; do not return them to a reviewer before annotation.

The revision preserves source text/context, requested categories, provenance, grouping
and split, restores original IDs, and requires a different dataset version. Only
submitted labels/rationales/spans and review declarations replace provisional annotations.
Empty `evidenceSpans` removes old unreviewed spans; it makes no semantic span claim.
Development stays development after real label review. Existing held-out splits retain
their freeze and must still pass reference checks. The CLI includes all three bundled
development references; supply other known exposed/reviewed data via repeated
`--reference FILE` arguments.

Retain source, packet, response, permission/reviewer records, guidance revision and
receipt together. The receipt links exact UTF-8 SHA-256 hashes for source, packet,
response, revision and references, original/packet case IDs and every label change.
It reports span/rationale changes without echoing text. Hashes detect mismatched
inputs; they are not signatures, identity verification or proof of an unbiased review.

## Review artifact contracts

| Format | Required content |
| --- | --- |
| `toxiply.text-review-packet.v1` | Source dataset ID/version/byte hash; taxonomy; unchanged label definition; ordered cases with opaque `case-00001` IDs and full bounded requests |
| `toxiply.text-review-response.v1` | Exact packet byte hash; new `datasetVersion`; reviewer alias; explicit `independentOfDevelopment: true`; one annotation per packet case |
| `toxiply.text-review-audit.v1` | Source/packet/response/revision/reference hashes; revision identity and preserved split; declared reviewer; label deltas and span/rationale change flags |

Packet requests replace only `requestId` with the opaque case ID. Text, quotations,
parent text, targeting, language hints and requested categories remain exact. Packets
omit source case IDs, labels, rationales, group/tags, old spans, provenance narrative
and model output. Dataset identity, ordering, content and label definition may still
reveal exposure; this is prediction-free preparation, not proof of blinding. Public
development text never becomes independent held-out data through this step.

Each response annotation has `id`, exact requested-category boolean `labels`, nonblank
`rationale`, ISO-UTC `reviewedAt`, and explicit `evidenceSpans` (possibly `[]`). Response
order is immaterial. Missing/duplicate/unknown cases, undecided/extra labels, author
reviewers, false/missing independence declarations and invalid source spans fail.
Packet contents must regenerate exactly from the source; altered content/context and
stale source/packet hashes fail. Unknown fields, including split/prediction overrides,
fail. Errors contain bounded codes/paths, not private content or exception messages.

## Draft annotation guidance 1.0.0

**Status: provisional, pending independent human agreement.** Owner and reviewer must
agree on the actual label definition before work. Record this guide revision and any
approved supplement/hash in the dataset's `labelDefinition` and private records before
preparing a packet. Do not retroactively reinterpret existing labels or change guidance
to fit analyzer predictions. This is a starting vocabulary, not a complete legal/safety
taxonomy or an approved production definition.

Annotate current-author meaning using supplied bounded text/context. A category can be
present despite a rule miss or evasion. A harmful parent or quotation is not automatically
endorsed by the current author. Evaluate explicit endorsement, current-author additions,
targets and context; quotation marks are not blanket exemptions. Product criticism is
distinct from personal abuse; roles and ambiguous nouns require context. Do not infer
missing history or intent as fact.

| Native category | Proposed presence criterion for owner/reviewer agreement |
| --- | --- |
| `toxicity` | Current-author abusive, degrading or hostile expression targeting people/groups; define its relationship to other labels explicitly |
| `harassment` | Current-author personal/group abuse, intimidation or directed degrading attack; disagreement or negative product feedback alone is insufficient |
| `hate` | Current-author group-directed dehumanization or discriminatory exclusion/denial of rights; record the supporting target/context without guessing identity |
| `threat` | Current-author expressed or contextually implied intent to inflict harm, including intimidation; distinguish reports, danger warnings and speculation |
| `sexual_risk` | Current-author directed unsolicited/coercive sexual solicitation or sexualized abuse under the agreed definition; neutral discussion alone is insufficient |

Labels overlap only when separately justified; no blanket implication is imposed.
Record each requested label independently even if old labels often co-occur. Broader
categories, especially age/consent-dependent judgments, need approved supplements.
Missing facts stay uncertain. `profanity` and `spam_scam` remain unsupported by native
and contextual analyzers. Do not reuse literal-profanity presence labels as author-harm
labels or claim native spam classification. Unsupported languages require a qualified
reviewer; an `en`/`und` hint is not proof of language or multilingual quality.

For each positive label, explain the author's contribution, target and necessary context
in the rationale. Optionally mark minimal sufficient category witnesses in original
`text`, `parentText` or `quotedText`. Use half-open UTF-16 offsets (JavaScript string
indices), never normalized indices, bytes or code-point counts. Do not split surrogate
pairs or mark absent/blank sources. If a warning depends on a parent, distinguish the
warning from the actual parent witness; parent evidence alone does not attribute that
author's words to the reply. Containment metrics assess supplied annotations only.

If attribution/meaning cannot be resolved, leave the annotation incomplete and escalate
privately; null is not false. The complete-response gate refuses it. Agree on a versioned
definition or independent adjudication before submission. Exclusions need a sampling
record created without model outcomes. This phase has one submitted reviewer per
response; no automated adjudication, consensus, sampling, calibration or promotion.
