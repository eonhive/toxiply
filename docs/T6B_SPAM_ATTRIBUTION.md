<!--
Company: EonHive Inc. | Title: T6B spam/scam attribution candidate
Purpose: Specify bounded exclusions, paired development findings and remaining quality gaps.
Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
Notes: Vibe coded with Codex.
-->
# T6B: optional spam/scam attribution candidate

The user explicitly authorized this bounded implementation while independent review
continues separately. `createEnglishSpamScamAttributionAnalyzer()` selects
`english-spam-scam-attribution` / `spam-scam-attribution-en-v2`. It wraps the unchanged
T6A `spam-scam-en-v1` scorer. T6A remains available and is not automatically replaced.
No V1 schema, package version, existing analyzer, default, dependency or Flaggr change.
This is deterministic heuristic development, not a trained AI model or validated detector.

## Exact grammar

The candidate excludes only these current-text spans before applying T6A scoring:

- Balanced, single-line quotations of at most 512 UTF-16 interior units, immediately
  preceded within 120 units by a listed frame: `the/a/this [scam/phishing] message
  read/said`, `the/a/an article/report/guide quotes/quoted`, or `scam/phishing
  example/message`, with optional colon. Straight/curly single/double quotes and
  backticks are supported. Word-internal apostrophes and backslash escapes are skipped.
  Mixed nested delimiters, unmatched, multiline and overlong quotes are not excluded.
- Clause-initial `never`, `do not`, or `don't` immediately followed by a listed
  send/tell/give/reply-with credential request. Only the request phrase is excluded.
  Optional me/us and your, plus password, verification code, one-time code/password,
  OTP, recovery phrase or seed phrase are recognized. `Do not delay` and `never
  forget to send` remain assessed. Clause starts are beginning of text or after
  `. ! ? ; :` or a line break, with optional spaces/tabs. Parsed quotations are not
  given this separate negation exemption.
- `Training slide:` or `Training example:` followed by one punctuation-free body
  of 1–240 units, a sentence terminator and `Do not follow that/this instruction`.
  Only that example body is excluded. A training keyword without the explicit
  disclaimer does not exempt text. Parsed quotations are handled by the quote rule.

Review correction v2 retains baseline scoring when a reporting/training frame is
immediately preceded by listed denial (`not`, `no`, `never`, `isn't`, `wasn't`, with
an optional article/determiner). `This is not a scam message: "..."` is not accepted
as reporting. A negated credential request also keeps baseline scoring if `unless`
or `except` appears in the following 160 units before a sentence/line ending.
Those exceptions can permit disclosure to the sender. Benign `even if` warnings
retain their existing treatment. This is a conservative finite guard; other ways of
denying a frame or expressing exceptions, or exceptions beyond the window, remain
limitations. Ambiguous advice can still produce false alarms.

PR #11 shipped v1. Review probes reproduced two false-negative families: conditional
credential advice under an impersonation claim, and denied reporting frames. Eight
synthetic regression probes cover these repairs and ambiguous denied training.
They are development tests, not independently reviewed evaluation. Existing diagnostic
labels/hashes and the measurements below remain unchanged; only candidate provenance
changes to v2. V1 is identifiable in older results; it is not a new selectable export.

An exclusion is blocked by listed endorsement in the preceding/following 160 units:
`I/we agree/endorse/approve`, `I mean it`, `do what it says`, `follow that/these/those
instructions`, or `that is true/correct`. This is a conservative finite guard, not
general endorsement detection. Unrelated nearby endorsement can retain a false alarm;
implicit, distant or unrecognized endorsement can cause a miss. Same-delimiter nested
quotations are ambiguous and are not reliably parsed. These are documented limitations.

## Scoring, evidence and coverage

Excluded UTF-16 units are replaced with non-whitespace barriers in a detached working
copy. Source text is never modified, persisted or logged. T6A scores the remaining
cues, using its existing 240-unit window, fixed maximum rule score and 26-witness bound.
Remaining cues can still combine across a masked range within that original window;
there is no new sentence segmentation or context interpretation. Any returned witness
overlapping an exclusion triggers fallback to the original T6A output rather than an
artificial witness. Evidence IDs/codes retain T6A's cue meanings and refer to original
`text` offsets. The composite candidate version identifies the changed attribution.
Independent solicitations elsewhere are still assessed; zero scores carry no evidence.

Only `spam_scam`, exact `en`, and current text are supported. `supportsContext: false`
is preserved: external parent/quote/target context is stripped and reported partial.
Missing/`und`/regional/non-English hints are unsupported. Other categories are omitted
with missing capabilities. Limits, failed/unsupported/partial statuses, uncalibrated
confidence and the default unconfigured entry point are unchanged. No URL checks,
identity/consent verification, external model, action, history or persistence occurs.

## Paired development report

Run `npm run eval:spam-attribution` or `node eval/run-spam-attribution.mjs` after
building. The runner reuses the existing versioned dataset validator, paired evaluator,
confusion metrics and source-span audit. Both engines must fully assess these datasets;
invalid/failed/incomplete execution fails the command. Classification errors remain
findings. `npm run check` runs the example and includes this diagnostic via `eval:all`.

| Dataset / analyzer | Cases | TP | TN | FP | FN | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Frozen T6A / T6A | 48 | 15 | 23 | 5 | 5 | 75% | 75% |
| Frozen T6A / T6B | 48 | 15 | 27 | 1 | 5 | 93.75% | 75% |
| T6B contrasts / T6A | 24 | 14 | 0 | 10 | 0 | 58.33% | 100% |
| T6B contrasts / T6B | 24 | 14 | 8 | 2 | 0 | 87.5% | 100% |

Frozen T6A SHA-256:
`94280d4d105f9ad240b3cfeb4fbb12a788da2ca1ef32044da28e600b937a87c7`.
New [24-case challenge](../eval/spam-scam-attribution.v1.json), version 1.0.0, SHA-256:
`358f239aba41622385d121ccdbc349ab6cfc93d3fbfbce54876b6681c6d98d0c`.
Both are exposed public synthetic development material with Codex-authored provisional
labels, not representative, independently reviewed, held-out or production validation.
No old label or scoring rule was changed. These rates do not justify enforcement.

On T6A, `warning-2/3` and `quote-1/2` are fixed; `satire-2` remains the only FP.
The five `gap-*` misses remain. On the challenge, all four reporting and four warning
FPs are fixed; `unknown-report` and `unmatched` remain FPs. Direct, endorsed and mixed
solicitations retain all 14 positive predictions. Paired regressions/new FP/FN are zero
on these two sets only, with 48/24 comparable cases respectively. No generalization
claim follows from tests authored alongside the candidate.

Structural evidence checked/invalid: frozen T6A 51/0 baseline and 42/0 candidate;
challenge 62/0 baseline and 33/0 candidate. No gold span annotations exist, so semantic
span precision/recall remain null. Per-case/group/category results are in the paired
JSON; source-valid evidence alone does not prove correct attribution.

## Verification, rollback and next bounded work

See [build status](../BUILD_STATUS.md) for exact final commands and test coverage.
Independent review, held-out comparison and calibration remain NOT_RUN. Synthetic
datasets must be included in future leakage/reference audits, never relabeled held-out.
No private dataset or new review declaration was created. Independent human validation
continues separately; no default promotion is authorized.

Rollback: select `createEnglishSpamScamAnalyzer()` instead of the candidate. The T6A
module, contracts and stored result shapes require no migration. Removing the new
factory/export, example/diagnostic and script entries fully removes this experiment.

Next bounded proposal: independently review contrast labels for endorsement and
unrecognized reporting, then evaluate one versioned expansion of the reporting grammar.
Keep satire interpretation, evasion, language expansion and model integration separate.
