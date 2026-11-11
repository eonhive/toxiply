# Toxiply

Toxiply is an independent TypeScript content-intelligence library. It analyzes text and bounded conversation context in process, with no Flaggr runtime imports, database, additional server, Python, or required external model. The package remains private and `UNLICENSED`; no npm release or open-source licensing decision is implied.

## Run and use

Requires Node.js 22 or later and npm:

```sh
npm ci
npm run check
npm run eval:all
```

`check` typechecks source/examples, builds, runs all tests, executes the unconfigured/native/lexical/contextual/spam-scam examples, and runs all public diagnostics. CI repeats it on Node 22 and 24. `eval:all` includes the lexical/native/spam-scam diagnostics, paired comparisons and the review workflow. Legacy diagnostics require complete coverage; the review workflow explicitly reports intentional partial/unsupported coverage without counting it benign. Failed/invalid execution fails the harness; classification mismatches remain findings.

```js
import { createAnalyzer, nativeTextAnalyzer, SCHEMA_VERSION } from '@eonhive/toxiply';

const engine = createAnalyzer(nativeTextAnalyzer);
const result = await engine.analyze({
  schemaVersion: SCHEMA_VERSION,
  requestId: 'example-1',
  content: { kind: 'text', text: 'Try me.' },
  categories: ['threat', 'harassment'],
  context: {
    languageHint: 'en',
    parentText: 'I will hurt you.',
    replyTarget: 'parent_author',
  },
});

console.log(result.status);           // completed
console.log(result.findings);         // threat 0.94, harassment 0.74, with rule evidence IDs
console.log(result.coverage.context); // analyzed
console.log(result.confidence);       // { calibrated: false }
```

Run `npm run example:native` for a complete result. The default `analyze(request)` stays unconfigured and returns `unsupported`, rather than inventing findings. `createAnalyzer()` accepts one optional local `TextAnalyzer`; no provider framework or service is required.

## Review text quality

```sh
npm run build
mkdir -p .local/reports .local/datasets
node eval/run-review.mjs compare > .local/reports/text-quality.json
node eval/run-review.mjs validate /absolute/path/to/approved-reviewed.json
node eval/run-review.mjs import /absolute/path/to/approved-reviewed.json .local/datasets
node eval/run-review.mjs compare .local/datasets/corpus-id@1.0.0.json \
  --reference /absolute/path/to/known-development.json \
  > .local/reports/reviewed-quality.json
```

The [versioned dataset format](docs/TEXT_EVALUATION_DATASETS.md) separates development,
human-reviewed and held-out declarations, requires explicit provenance/category labels,
and checks held-out text overlap against bundled and supplied reference data. Imports
preserve bytes and refuse overwrites. Human identity, rights and independence still
require actual review; filling metadata cannot create independent validation.

Review per-category confusion/precision/recall, FP/FN IDs, criticism/reporting/threat/evasion
slices, unsupported coverage and source-span audits for **both** analyzers. Inspect cases
against the original hashed dataset; structural span validity is not semantic correctness.
Keep nonpublic datasets/reports ignored or outside Git. Nothing uploads content.

[T3 baseline and remaining gaps](docs/T3_BASELINE.md) records public development results
and exact verification. No reviewed/held-out corpus is claimed, labels/scoring remain
unchanged, and the contextual candidate remains opt-in. Convenience commands are
`dataset:validate`, `dataset:import`, and `eval:review`; use the direct Node commands
above when saving machine-readable JSON because npm wrappers also print build logs.

For actual human annotation, the [offline review handoff](docs/TEXT_ANNOTATION_REVIEW.md)
provides `prepare-review`, `review-template` and `apply-review` through the same CLI.
Packets omit old labels/predictions, templates remain blank, and responses must match
source/packet hashes before creating a new immutable dataset version and audit receipt.
Development splits stay development. [T4 scope and verification](docs/T4_REVIEW_WORKFLOW.md)
keep existing labels provisional; no approved reviewer/corpus or independent result
is supplied by this workflow.

[Phase T5 readiness](docs/T5_VALIDATION_READINESS.md) audits these existing tools and
defines source/rights, reviewer, split-freeze and annotation onboarding gates. Verification
passes; no approved corpus or actual independent reviewer was supplied, so reviewed and
held-out evaluation remain NOT_RUN. The report keeps synthetic findings separate and
proposes one future attribution experiment without implementing or promoting it.

## Actual capabilities

| Analyzer | Coverage | Limits |
| --- | --- | --- |
| `nativeTextAnalyzer` | Deterministic heuristic `toxicity`, `harassment`, `hate`, `threat`, `sexual_risk`; parent/quote/target context | Exact `en` or explicitly unknown `und`; no translation or language detection; known quote/criticism/evasion errors |
| `contextualTextAnalyzer` | Separate opt-in candidate using the same five categories with narrow report/criticism attribution | Provisional development evidence only; no general author-intent understanding or default replacement |
| `createEnglishProfanityAnalyzer()` | Separate, opt-in 12-token English literal-presence signal | Exact `en`; no semantic context, severity, author-intent, obfuscation, or comprehensive profanity classification |
| `createEnglishSpamScamAnalyzer()` | Separate, opt-in deterministic combinations of spam/scam wording in current text | Exact `en`; no context/author attribution, URL safety, reputation, calibration or production validation |
| `createEnglishSpamScamAttributionAnalyzer()` | Separate opt-in T6B candidate excluding narrowly framed reports/warnings before T6A scoring | Exact `en`; no external semantic context or general attribution; provisional development evidence only |

The native analyzer does **not** advertise `profanity` or `spam_scam`. Mixed requests return `partial` with unavailable categories omitted and listed in `missingCapabilities`; unsupported-only requests produce no findings. The separate literal detector has [its own specification](docs/ENGLISH_PROFANITY.md). Spam/scam is available only through the optional factory below. No adapter implements pixels, OCR, speech recognition, audio, video, persistent actor history, policy, routing, or enforcement.

Native content scoring is the audited extraction already present in this repository, with rule-level evidence instrumentation. Its scores and internal subtype/severity/targeting behavior remain compatible with the frozen legacy diagnostic. This is functional heuristic analysis, not a trained semantic model or a production-accuracy claim. Product criticism, literal animals, reported abuse, sarcasm, implied threats and obfuscation remain known error areas.

## Opt-in English spam/scam indicators

```js
import { createAnalyzer, createEnglishSpamScamAnalyzer } from '@eonhive/toxiply';

const spam = createAnalyzer(createEnglishSpamScamAnalyzer());
const result = await spam.analyze({
  schemaVersion: 'toxiply.analysis.v1', requestId: 'spam-1',
  content: { kind: 'text', text: 'Your account is suspended. Sign in here immediately.' },
  categories: ['spam_scam'], context: { languageHint: 'en' },
});
// result.status === 'completed'; score 0.9; three source-relative cue spans.
```

Positive means a documented combination of suspicious surface wording within 240
UTF-16 units, not proven fraud or malicious intent. A bare URL, brand, price, urgent
word or ordinary discount is insufficient. Scores are uncalibrated; zero is not safety.
An absent language hint is unsupported `und`. Parent/quote/reply-target context is
not evaluated and produces partial coverage. Quotes, educational warnings, negation
and satire can match; obfuscation and unlisted wording can be missed. No URL fetch,
reputation query, external model or automatic action occurs.

Run `npm run example:spam-scam` and `npm run eval:spam-scam`. The separate 48-case
provisional synthetic diagnostic reports 15 TP / 23 TN / 5 FP / 5 FN, with 51 valid
source spans. This is development evidence only, not independent validation or an
enforcement threshold. [Exact rules, comparison report, limits and T6B proposal](docs/ENGLISH_SPAM_SCAM.md).

## Opt-in spam/scam attribution candidate

For spam/scam reporting and educational warnings, T6B supplies a separate optional
`createEnglishSpamScamAttributionAnalyzer()` factory. T6A remains unchanged:

```js
import { createAnalyzer, createEnglishSpamScamAttributionAnalyzer } from '@eonhive/toxiply';
const spamCandidate = createAnalyzer(createEnglishSpamScamAttributionAnalyzer());
// Same V1 spam_scam request, with exact languageHint: 'en'.
```

It excludes narrowly framed quotations, negated credential advice and explicit training
examples. Bare quotes and warning keywords are not blanket exemptions; independent
requests and listed endorsement retain scoring. Semantic context remains unsupported.
Run `npm run example:spam-attribution` and `npm run eval:spam-attribution` (also in
`check`/`eval:all`). On the unchanged 48-case provisional diagnostic, FPs decrease 5→1
with TP/FN unchanged at 15/5. A new 24-case provisional contrast set records 14 TP,
8 TN, 2 FP, 0 FN. These are development findings, not independent accuracy evidence.
See [T6B's exact grammar, comparison and limits](docs/T6B_SPAM_ATTRIBUTION.md).
The v2 review repair prevents listed denied reporting frames and `unless`/`except`
disclosure exceptions from receiving a warning/report exemption. T6A and the public
contracts remain unchanged; ambiguous and unrecognized phrasing remain limitations.

## Opt-in attribution candidate

```js
import { createAnalyzer, contextualTextAnalyzer } from '@eonhive/toxiply';

const candidate = createAnalyzer(contextualTextAnalyzer);
// Use the same V1 request shape as the native analyzer.
```

The separately versioned `contextual-attribution-v1` candidate excludes narrowly recognized third-party/report quotations and product-directed insult tokens before running the frozen scoring rules again. Nearby explicit endorsement and personal comparisons preserve baseline behavior. Independent author threats, insults, hate and sexual requests remain assessed, with evidence pointing to their actual remaining occurrences. It applies the same narrow attribution to parent text and preserves other bounded context.

Quotation marks, a report keyword elsewhere, and equality with `context.quotedText` are not blanket exemptions. Unmatched/multiline quotes, unquoted reports, ambiguous product/person nouns, implicit endorsement, nonlocal references and unrecognized grammar remain limitations. A non-whitespace internal mask preserves UTF-16 offsets without joining words; a witness crossing a masked range causes fallback to the baseline. The original request is unchanged, and excluded text is never returned as harmful evidence merely to satisfy validation.

Run `npm run example:contextual` or `npm run eval:quality`. The frozen `nativeTextAnalyzer` is unchanged and the default `analyze()` remains unconfigured. No schema, language/category coverage, confidence-calibration or Flaggr integration change is introduced. See [the exact attribution specification](docs/CONTEXTUAL_ATTRIBUTION.md).

## Contract and status

The public schema is `toxiply.analysis.v1`, with taxonomy `toxiply.categories.v1`. Existing request/result shapes are preserved in this change. Core 0.2.0 already added optional `context.replyTarget: parent_author | group | self | unknown`; older strict V1 validators do not accept that added field. It is a semantic hint, never a persistent actor ID or role. No new schema change is introduced here.

Public exports include `AnalysisRequest`, `AnalysisResult`, `TextAnalyzer`, `ContentAnalyzer`, `analysisRequestSchema`, `analysisResultSchema`, and portable Draft 2020-12 request/result JSON Schemas. Checked-in schema artifacts are tested for drift. Runtime refinements additionally validate aggregate context, uniqueness, status consistency, evidence references, and source-relative spans. Other language implementations must enforce those documented semantic checks too.

| Status | Meaning |
| --- | --- |
| `completed` | All requested categories and supplied context were processed by the selected algorithm; this is execution coverage, not correctness or safety. |
| `partial` | Some categories were processed, with explicit unavailable category/context metadata. |
| `unsupported` | Valid request, but no applicable analyzer/category/language; no fabricated scores or model versions. |
| `failed` | Invalid request/configuration, execution exception, or invalid analyzer output; no findings retained. |

Each result contains category scores, evidence, engine/analyzer versions, coverage, missing capabilities, uncalibrated confidence, and a structured error or `null`. Errors contain bounded issue codes/paths without echoing raw content or exception messages. A valid request ID is preserved on invalid requests; otherwise it is `null`.

## Conversation and evidence

Parent text, quoted text, and reply-target hints reach the native conversation lane unchanged. Parent hostility can enable contextual warning rules; targeting and quote presence affect internal escalation/summary metadata. Separate quoted text is not automatically attributed to the current author. However, harmful language quoted inside `content.text` still triggers known legacy false positives: actual surface evidence does not establish author endorsement. No blanket quote suppression or new moderation policy is introduced.

Native evidence identifies the first actual match of each contributing rule, using half-open UTF-16 offsets into the unchanged `text` or `parentText` field. A normalization map preserves source indices across whitespace trimming and Unicode case expansion. Evidence codes such as `lexical.insult.moron`, `semantic.threat.intent_to_harm`, and `semantic.threat.hostile_parent` identify the matched cue. Only relevant positive categories reference each item. Enum hints, unrelated quotes, and whole input fields are not invented as harmful witnesses. A mapping failure fails analysis rather than manufacturing a span.

The finite rule set bounds evidence below the contract's 64-item maximum. Repeated matches are not exhaustive counts. Zero scores have no invented evidence and do not prove safety. Scores are uncalibrated signals in `[0, 1]`, not probabilities; `confidence.calibrated` stays `false`.

The composite native version is `native-content-heuristic-v2.evidence-v1`. Scoring lanes remain `lexical-heuristic-v2`, `semantic-heuristic-v2`, `conversation-heuristic-v2`, and `toxiply-aggregator-v2`. The composite version changed because evidence semantics changed. Internal legacy subtype, severity, targeting, escalation and heuristic confidence labels are deliberately not forced into the portable V1 result, which has no such fields. A future Flaggr adapter must define its own tested mapping.

## Input limits

Strict validation rejects unknown fields, wrong versions, non-text request shapes, coerced/empty/blank text, duplicate categories, invalid targeting, and oversized inputs. Text limits are Unicode code points; evidence uses UTF-16 indices.

| Input | Maximum |
| --- | ---: |
| `content.text` | 16,000 |
| `context.parentText` | 4,000 |
| `context.quotedText` | 4,000 |
| Combined parent and quote | 6,000 |

The core never truncates, persists, fetches or logs input. Native heuristics normalize a working copy only; evidence always refers to original fields. Local custom analyzers are trusted code; the host owns their execution limits. Unsupported context is removed before invoking adapters that declare no context support, and the result reports partial coverage.

## Evaluation and provenance

The native public diagnostic records **13 TP, 7 TN, 5 FP, 7 FN** across 32 independently authored synthetic cases. Its labels are provisional and pending human review. The separate lexical diagnostic records **14 TP, 10 TN, 0 FP, 12 FN** across 36 cases. Neither set is representative, held-out, calibrated, or independently validated.

Paired evaluation of the contextual candidate on the unchanged 32-case diagnostic records **13 TP, 12 TN, 0 FP, 7 FN**. The new 35-case provisional attribution challenge changes **19 TP / 0 TN / 16 FP / 0 FN** for the baseline to **19 TP / 14 TN / 2 FP / 0 FN** for the candidate. No new overall false positives, false negatives or category-label regressions appear on these two development sets. This is observed development behavior, not proof of generalization or production quality. The user explicitly chose to keep labels provisional for this PR; independent human review and a genuinely held-out corpus remain unperformed.

A local comparison against 40 frozen private legacy fixtures matches all content fields and all five public scores, with zero category or severity differences. Four quoted-report attribution warnings remain. These compatibility results are separate from accuracy. Private examples/reports are not committed or needed for installation/public CI. Use `npm run eval:legacy -- /absolute/path/to/authorized-frozen-report.json` to reproduce locally with authorized fixtures; incomplete/out-of-scope fixtures are reported explicitly and make the CLI fail.

See [evaluation methods and findings](docs/EVALUATION.md), [source provenance and compatibility](docs/PROVENANCE.md), [architecture](docs/architecture/TOXIPLY_CORE.md), and [decisions](docs/DECISIONS.md). This change transfers no further private implementation, fixture, customer data, credential, or operational report. Source provenance for the existing extraction is recorded separately; public repository visibility and a private npm package do not grant a redistribution license.

The Phase 2 engine and opt-in attribution candidate are preserved. Phases T3–T5 add evaluation, offline annotation and readiness work; T6A adds only the separate optional English spam/scam analyzer. Real independent review continues separately. Analyzer promotion, Flaggr integration, media, deployment and publication remain separate tasks.
