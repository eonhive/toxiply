# Contextual attribution candidate

Updated: 2026-10-30 · Analyzer: `contextual_content` / `contextual-attribution-v1`

## Purpose and opt-in boundary

Use `createAnalyzer(contextualTextAnalyzer)` to evaluate a narrow author-attribution experiment. The original `nativeTextAnalyzer` remains frozen and separately available. Default `analyze()` remains unconfigured. This candidate uses the same V1 contracts, five native harm categories, exact `en`/`und` hints and bounded parent/quote/reply-target context. Unsupported categories/languages retain normal missing-capability metadata, and confidence stays uncalibrated.

The candidate runs existing native scoring after excluding specifically recognized reported passages or product-directed insult tokens. It does not implement a general semantic model, reliable author-intent understanding, arbitrary quote handling, new evasion normalization or automatic moderation policy.

## Reported quotation grammar

Only balanced quotations on one line, at most 512 UTF-16 units between delimiters, are considered. Straight/curly single or double quotes and backticks are supported; word-internal apostrophes are not delimiters, and backslash-escaped delimiters are skipped. Nested or malformed quotation syntax is not claimed as supported.

A recognized report must have a directly related local frame, such as:

- `I reported the message "..."`, `We documented the remark '...'`, or another listed reporting verb/object pair.
- `Someone wrote "..."`, `They said “...”`, or another listed third-party subject/verb pair.
- `Our transcript quotes ...` or document/record/cite/include grammar for notes, reports, complaints or transcripts.
- `The phrase "..." appeared in the report` or `The message '...' was reported`, with both the subject and suffix present.

Decisions use at most 160 UTF-16 units of nearby clause context on either side, bounded by line/sentence endings. A report keyword elsewhere, quotation marks alone, the author's `I said ...`, or merely copying the same text into `context.quotedText` is not an exemption.

Recognized nearby endorsement blocks exclusion. Examples include `I agree`, `we approve`, `I mean it`, `that is true`, `that’s true`, `describes you`, `you deserve it`, `well said` and `exactly`. The list is deliberately finite. Implicit endorsement, negation, sarcasm, distant references, attributed nested speech and unrecognized reporting grammar can still be misclassified. Non-report quotes keep the baseline's behavior; explicit third-party/report grammar is itself a heuristic, not proof of innocence.

## Product criticism grammar

Only the insult words `trash`, `garbage`, `stupid`, `dumb`, `pathetic` and `worthless` in an explicit product-object construction are excluded. Examples are `The app is garbage`, `Your interface feels utterly pathetic`, and `a stupid design decision`. The finite object vocabulary contains app/application, software, release/update, editor/interface, configuration wizard, design/decision, feature, service/product, website/tool, documentation, build and game. No human-role noun such as developer or support team is recognized as a product object.

Nearby personal comparisons/direct predicates such as `just like you`, `so are you`, or `you are` prevent exclusion. Only the matched insult token is excluded, never the whole complaint. Independent personal insults, hate, threats and sexual requests elsewhere still run through the native scorer. Ambiguous nouns such as editor, service or tool can refer to people; unsupported grammar and indirect personal attacks remain risks requiring external evaluation.

## Source evidence and context

Working copies replace excluded UTF-16 units with a non-whitespace barrier, preserving all later offsets and preventing whitespace-based phrase joins across the passage. Parent text receives the same attribution treatment so a quoted report in a parent is not automatically treated as a hostile parent. Separate quoted context and reply-target hints remain available to the native conversation lane.

The original input is unchanged. The scorer must supply actual, non-overlapping witnesses from remaining author-attributed text. If a positive witness crosses an excluded range, the candidate falls back to the original baseline assessment rather than publishing an artificial cross-boundary span. Excluded spans are not fabricated as harmful evidence. Zero findings have no invented evidence, and zero scores remain limited algorithm signals rather than proof of safety.

## Validation and remaining evidence

Run `npm run example:contextual`, `npm run eval:quality`, or the full `npm run check`. Paired reports include unchanged dataset hashes/labels, baseline/candidate versions, per-group/category metrics, fixed/new false positives and negatives, and changed scores/evidence. The original 32-case diagnostic remains byte-for-byte unchanged. The new 35-case challenge includes reporting, criticism, explicit endorsement, mixed author abuse, direct attacks and ambiguous quotation use.

Both datasets are synthetic development material with provisional labels. The user explicitly kept those labels provisional for this PR. Neither dataset is an independently reviewed held-out corpus; tests and observed gains do not establish production accuracy or safe automation. See [measured diagnostics](EVALUATION.md). No default replacement, Flaggr integration, deployment or publication is part of this quality pass.
