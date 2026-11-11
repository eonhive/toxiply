<!--
Company: EonHive Inc. | Title: T6A English spam/scam specification and diagnostic
Purpose: Define opt-in surface indicators, source evidence and provisional development results.
Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
Notes: Vibe coded with Codex.
-->
# Optional English spam/scam indicators — T6A

Analyzer: `english-spam-scam` / `spam-scam-en-v1`. Engine/package: `0.2.0`.
Enable with `createAnalyzer(createEnglishSpamScamAnalyzer())`. Only `spam_scam`
and an exact `context.languageHint: 'en'` are supported. An absent hint is `und`,
not detected English. `und`, regional hints and other languages are unsupported.
The default `analyze()` and existing analyzers remain unchanged.

## Meaning of a positive signal

A score greater than zero means the unchanged current text contains at least one
documented combination of suspicious surface cues within **240 UTF-16 units**
from its earliest cue start to latest cue end, inclusive. Cue order is unrestricted;
the window may cross sentences or lines. It does not establish an actual scam,
unsolicited delivery, fraudulent identity, malicious intent, unsafe URL, or a policy
violation. A zero means no implemented combination matched, not that text is safe.
Scores are fixed, uncalibrated ordinal rule signals in `[0,1]`, never probabilities,
severity classifications, or enforcement recommendations. Multiple rules use the
maximum score; repetition does not add scores.

The independently authored finite cue grammar is in
[`src/text/english-spam-scam.ts`](../src/text/english-spam-scam.ts).
Matching uses case-insensitive Unicode regular expressions against original text,
without URL parsing, Unicode normalization, translation or evasion decoding.
Unicode letters/marks/numbers/underscores bound tokens. Spaces/tabs inside specified
phrases are accepted; arbitrary inserted punctuation/newlines are not.

| Rule code suffix | Required cues (all local) | Score |
| --- | --- | ---: |
| `credential_impersonation` | Explicit send/tell/give/reply-with secret request + listed identity claim | 0.95 |
| `credential_pressure` | Secret request + listed urgency phrase | 0.90 |
| `prize_fee` | Personal win/selection claim + pay/send processing/claim/release/delivery fee | 0.90 |
| `prize_credentials` | Personal win/selection claim + secret request | 0.95 |
| `financial_solicitation` | Guaranteed profit/returns, risk-free investment or double-your-money phrase + money instruction | 0.90 |
| `payment_pressure` | Money instruction + gift-card/bitcoin/crypto wording + urgency | 0.85 |
| `payment_impersonation` | Money instruction + gift-card/bitcoin/crypto wording + identity claim | 0.90 |
| `phishing_login` | Account suspended/locked/deleted/closed + login/verify instruction + urgency | 0.90 |
| `unsolicited_promotion` | Explicit unsolicited/cold-outreach/did-not-sign-up wording + promotion + call to action | 0.65 |
| `repeated_promotion` | Three occurrences of the same listed promotional phrase + call to action | 0.70 |

Secret vocabulary is password, verification code, one-time code/password, OTP,
recovery phrase and seed phrase. Identity grammar is `I am`, `this is` or `we are`
optionally followed by `your`, then bank, CEO, boss, IT support, customer support or
the tax office. It matches a claim, without verifying identity. Urgency grammar is
`act now`, `immediately`, `urgent`, `within N minute(s)/hour(s)` (1–3 digits),
`do not delay` or `last chance`. Money instructions combine send/transfer/wire/
deposit/invest (optionally me/us) with a numeric amount, money, funds, bitcoin,
crypto/currency or gift cards; pay accepts an amount or listed payment medium,
optionally introduced by with/using. These are textual cues, not transaction checks.

Promotional phrases are `limited time offer`, `exclusive deal`, `buy one get one
free`, and `special discount`. Actions are `buy now`, `order now`, `click here`,
`contact me`, and `dm me`. Repetition keys lowercase the matched phrase and collapse
spaces/tabs; three different offers do not count as three repetitions. Three same
phrases without a local action also do not qualify. A bare URL, brand, currency
symbol, amount, urgency word or single ordinary promotion is insufficient.

## Evidence, coverage and execution

Each rule returns its first complete local witness set, including every required cue.
Repetition returns three actual phrase occurrences plus an action. Evidence uses
half-open original-text UTF-16 offsets with source `text`, deterministic IDs `spam-N`
and codes `spam_scam.<rule>.<cue>`. Overlapping money/method spans and the same source
span contributing to different rules are intentional. Nothing invents an identity,
URL assessment, supporting span or quotation attribution. All evidence is referenced
by the single finding; zero findings have no evidence. Nine finite combination rules
plus one repetition witness set bound output to **26 items**, below the V1 limit 64.
The text limit remains 16,000 code points; input is never changed or truncated.

`supportsContext` is **false**. Parent/quoted/reply-target context is stripped by the
existing core before execution and produces `partial` with `semantic_context`
unsupported when `spam_scam` runs. Mixed category requests are partial; unsupported
categories receive no placeholder findings. Unsupported language/category-only
requests have no model version or scores. Language hints alone are not semantic context.

There is **no author-attribution or negation model**. Suspicious wording in quotations,
education, reporting, jokes, negated advice or hypothetical examples can still match.
Copying it to `context.quotedText` is not an exemption. Nearby unrelated clauses can
combine, and narrow patterns miss synonyms, obfuscation, implied requests, nonlocal
references and messages without literal companion cues. Benign gift-card purchases,
repeated newsletters and truthful recovery language can be ambiguous. No sender,
delivery-consent, prior-message, tenant, actor, reputation or actual payment knowledge
is available. The analyzer does not provide comprehensive phishing detection or URL
safety. There are no fetches, redirects, crawling, credential checks, input logs,
stores, external models or network dependencies.

## Synthetic diagnostic and comparison report

Dataset: [`english-spam-scam.v1.json`](../eval/english-spam-scam.v1.json),
`english-spam-scam-diagnostic` version `1.0.0`, existing `toxiply.text-eval.v1` format.
SHA-256: `94280d4d105f9ad240b3cfeb4fbb12a788da2ca1ef32044da28e600b937a87c7`.
All 48 examples and labels were authored with Codex alongside the analyzer on
2026-11-11; provenance is explicitly public synthetic development, labels provisional,
review pending. No customer/private input or external corpus was used. These data are
not representative, independently reviewed, held-out, or production validation.

Labels describe suspicious current-message solicitation, with quotations, education,
normal promotions and satire negative. Prediction is score > 0. The distinction from
surface-rule semantics intentionally exposes attribution errors; labels are not
changed to fit the implementation. Class balance: 20 positive / 28 negative.

| Group | Cases | TP | TN | FP | FN |
| --- | ---: | ---: | ---: | ---: | ---: |
| phishing | 2 | 2 | 0 | 0 | 0 |
| prize | 2 | 2 | 0 | 0 | 0 |
| payment | 2 | 2 | 0 | 0 | 0 |
| credentials | 3 | 3 | 0 | 0 | 0 |
| financial | 2 | 2 | 0 | 0 | 0 |
| promotional | 3 | 3 | 0 | 0 | 0 |
| announcements | 2 | 0 | 2 | 0 | 0 |
| support | 3 | 0 | 3 | 0 | 0 |
| legitimate_payments | 3 | 0 | 3 | 0 | 0 |
| education | 3 | 0 | 1 | 2 | 0 |
| quoted_examples | 3 | 0 | 1 | 2 | 0 |
| satire_urgency | 2 | 0 | 1 | 1 | 0 |
| ordinary_links | 2 | 0 | 2 | 0 | 0 |
| normal_promotions | 3 | 0 | 3 | 0 | 0 |
| isolated_cues | 5 | 0 | 5 | 0 | 0 |
| evasion_gaps | 5 | 0 | 0 | 0 | 5 |
| boundaries | 3 | 1 | 2 | 0 | 0 |
| **Total** | **48** | **15** | **23** | **5** | **5** |

On these provisional labels only: precision/recall 75%/75%, false-positive rate
17.86%, false-negative rate 25%. False-positive IDs: `warning-2`, `warning-3`,
`quote-1`, `quote-2`, `satire-2`. False negatives: `gap-1` through `gap-5`.
All 48 candidate requests completed; 51 witnesses checked, 0 invalid, 0 annotated
gold spans. Semantic span precision/recall are null; source structure does not prove
correct attribution. The baseline native analyzer is unsupported on all 48 requests:
0 assessed, 48 unassessed, null quality rates. There are **0 comparable cases**;
no accuracy improvement over native is measured or inferred from coverage expansion.

The runner reuses the existing coverage-aware comparator, Zod dataset/result validation,
source-span audit and confusion metrics. Failed, invalid or incomplete candidate
execution fails the command; classification errors remain reported findings.
Existing T5 references and frozen diagnostic bytes are untouched. This new exposed
dataset must be included in future leakage/reference audits; it is not a T5 holdout.

```sh
npm run example:spam-scam
npm run eval:spam-scam
# After building, save machine-readable JSON without npm build-log prefixes:
node eval/run-spam-scam.mjs > .local/t6a/spam-comparison.json
```

Create the ignored output directory before redirection. `check` and `eval:all` include
the new example/diagnostic. Raw local logs remain ignored; this public report summarizes
only the explicitly public synthetic input above.

## Baseline, validation and proposed T6B

Before edits, Node 22.22.2 / npm 10.9.7 passed `npm ci`, `npm run check` (249/249 tests,
four examples, existing diagnostics), and explicit `npm run eval:all`. Native/contextual
five-category scores, lexical scores, V1 contracts, default unsupported behavior and
their diagnostic labels/versions were preserved. Final checks are recorded in
[`BUILD_STATUS.md`](../BUILD_STATUS.md).

T6B proposal, not implemented: collect approved independent contrast labels for scam
solicitations versus quoted warnings, negated advice, satire and legitimate support/
payments. Use frozen development references including this dataset; keep separately
collected held-out inputs independent. Scope one versioned attribution experiment
from those labels, report regressions and evidence alignment, and preserve T6A as the
explicit baseline. Independent validation proceeds separately and did not block this
bounded feature. No automatic enforcement, default promotion, Flaggr integration,
network reputation service, release or deployment is authorized by these diagnostics.
