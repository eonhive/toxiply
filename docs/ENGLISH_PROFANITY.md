# Literal English profanity capability

Updated: 2026-10-30 · Algorithm: `english-literal-profanity` / `literal-en-v1`

## Supported behavior

Use `createAnalyzer(createEnglishProfanityAnalyzer())` with category `profanity` and an explicit `context.languageHint: "en"`. The library supplies one offline deterministic lexical analyzer. No model weights, training, external word list, provider, or new runtime dependency is involved. Use the core wrapper for request/output validation and capability selection; the raw adapter expects an already validated, compatible request.

The exact, independently authored vocabulary is:

```text
fuck fucks fucked fucking
shit shits shitty bullshit
bitch bitches asshole assholes
```

Matching is ASCII case insensitive on whole tokens. Unicode letters, combining marks, numbers, and underscores stay together in a token; other characters separate tokens. Only entirely ASCII-letter tokens can match. Thus punctuation and emoji can surround a match, but substrings in `shit_post`, `shit123`, `shiitake`, decorated words, and larger words do not match. No stemming, general compound matching, Unicode normalization, symbol/digit substitutions, or spaced-letter reconstruction is performed.

Apostrophes, URL punctuation, and hyphens are separators too. A literal token in a URL, quoted example, report, educational discussion, or animal-related use receives the same lexical signal. This algorithm does not interpret whether the use is profane in context or endorsed by the author.

## Scores, evidence and versions

- `score: 1`: at least one documented token matched. The first matching token provides evidence with code `profanity.literal_token`, source `text`, and unchanged-source UTF-16 offsets.
- `score: 0`: none of the documented tokens matched. Evidence is empty. This does not rule out other profanity or imply that content is safe.

The signal is binary presence only. It is not severity, a probability, confidence in author intent, or an occurrence count. At most one witness span is returned even when many tokens match. `confidence.calibrated` remains `false`.

`modelVersions` records `{ "english-literal-profanity": "literal-en-v1" }` only when invoked. The descriptor names a lexical algorithm, not a trained model. Vocabulary, tokenization, case matching, scores, or witness-selection changes require a new algorithm version. The underlying core and V1 contract are unchanged by Phase 2.

## Coverage and missing capabilities

| Request | Result |
| --- | --- |
| `profanity`, exact `en`, no semantic context | `completed` with a binary lexical finding |
| `profanity` plus another category | `partial`; other categories are omitted and explicitly missing |
| Only another category | `unsupported`, no findings or algorithm invocation |
| Missing language hint, another language, or `en-us` | `unsupported`, with explicit missing language; no detection or fallback |
| Parent/quoted context fields supplied | `partial`; those fields are excluded from analyzer input and semantic context is explicitly missing |
| Malformed or oversized request | `failed` before analyzer execution |

Quoting inside `content.text` is literal input and can match. Separate `context.quotedText` and `context.parentText` are not read by this analyzer. Attribution, sarcasm, discrimination, threats, harassment, semantic toxicity, and other safety judgments are unimplemented. In-category gaps such as obfuscation and unlisted profanity are documented algorithm limits; they do not acquire separate V1 missing-capability entries. Consumers must use this specification with the result's algorithm version rather than interpreting category coverage as exhaustive accuracy.

## Diagnostic evidence and remaining review

The diagnostic includes broader profanity labels than the vocabulary so missed unlisted/obfuscated forms remain visible. See [the evaluation method and initial result](EVALUATION.md). Labels are Codex-authored and pending human review. No production quality, multilingual, contextual-understanding, or enforcement claim is established by these tests.
