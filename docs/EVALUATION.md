# English profanity diagnostic

Updated: 2026-10-30 · Dataset: `english-profanity-diagnostic-v1`

## Purpose and label definition

The [36-case dataset](../eval/english-profanity.v1.json) is a synthetic development diagnostic. Its examples and provisional labels were authored independently with Codex for this repository. No private implementation, external lexicon, customer text, or private dataset was copied. The examples were developed alongside the analyzer; they are not held-out validation or representative production data. **Human label review is pending.**

Labels ask whether English profanity is present in the current text, including common obfuscated spellings and words outside the shipped lexicon. Quotes, reports, and educational mentions count as surface profanity, without establishing author endorsement or a policy violation. Substrings inside ordinary words and identifiers do not count under this provisional definition. Each case has a stable ID, group, explicit boolean label, and rationale.

The diagnostic intentionally asks a broader question than the literal detector can answer. Unlisted/obfuscated positives expose its limits. Test expectations for the shipped lexical algorithm live separately in `tests/profanity.test.mjs`; labels must not be changed merely to make the detector appear more accurate.

## Reproduce

```sh
npm ci
npm run eval:text
```

The command builds and prints JSON to stdout. To save the JSON directly after building, run `node eval/run.mjs > /tmp/toxiply-profanity-report.json`. The report is deterministic: it has no timestamps or machine-dependent latency measurements.

It records a SHA-256 of the exact UTF-8 dataset file, the label definition and review provenance, engine/taxonomy/analyzer versions, per-case predictions and witness spans, per-group confusion metrics, and mismatch IDs. Positive prediction means `score === 1`; negative means `score === 0`. Failed, partial, unsupported, malformed, nonbinary, or version-inconsistent results abort evaluation rather than being counted benign. Metrics with zero denominators are `null`.

The command succeeds when the diagnostic ran correctly. Label mismatches remain reported findings, not a production quality gate. CI runs it through `npm run check`, and harness tests verify confusion metrics and failure handling independently of the native analyzer.

## Initial measured result

Analyzer: `english-literal-profanity` / `literal-en-v1` · Core: `0.1.0`

Dataset SHA-256: `d8269d080c11da697870c4aa19a4ed83164406b4c9aa7b23a2ad69cf8b716ef4`

| Group | Cases | True positives | True negatives | False positives | False negatives |
| --- | ---: | ---: | ---: | ---: | ---: |
| Literal | 8 | 8 | 0 | 0 | 0 |
| Quoting/reporting | 4 | 4 | 0 | 0 | 0 |
| Unlisted profanity | 4 | 0 | 0 | 0 | 4 |
| Obfuscated | 8 | 0 | 0 | 0 | 8 |
| Benign | 8 | 0 | 8 | 0 | 0 |
| Boundaries | 4 | 2 | 2 | 0 | 0 |
| Total | 36 | 14 | 10 | 0 | 12 |

Class balance: 26 provisional positives and 10 provisional negatives. Against these labels only: precision 100%, recall 53.8%, false-positive rate 0%, false-negative rate 46.2%. The absence of false positives in this small development set does not establish production precision or contextual reliability.

Misses are `unlisted-01` through `unlisted-04` and `obfuscated-01` through `obfuscated-08`. The zero scores on those cases mean no shipped token matched; they do not mean the broader text is profanity-free. No analyzer retuning or label changes were made to hide those misses.

## Human review and future comparison

A human reviewer should check every label/rationale against the stated surface-presence definition, especially mild expletives, quoted reporting, identifiers, and masked spelling. Record actual reviewer attribution and review date only after that review. Version any label-definition changes, keep case IDs traceable, rerun the report, and update the recorded dataset hash and measured table.

Human review of this development set alone still does not establish production performance. A later quality milestone needs a separately labeled held-out dataset before broader semantic coverage or moderation-action claims. Phase 2 implements the analyzer and diagnostic tooling; it does not fabricate that remaining evidence.
