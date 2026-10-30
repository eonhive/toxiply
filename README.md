# Toxiply

Toxiply is an independent TypeScript content-intelligence library. It analyzes text and bounded conversation context in process, with no Flaggr runtime imports, database, additional server, Python, or required external model. The package remains private and `UNLICENSED`; no npm release or open-source licensing decision is implied.

## Run and use

Requires Node.js 22 or later and npm:

```sh
npm ci
npm run check
npm run eval:all
```

`check` typechecks source/examples, builds, runs all tests, executes the unconfigured/native/lexical examples, and runs both public diagnostics. CI repeats it on Node 22 and 24. `eval:all` runs the 36-case lexical profanity diagnostic and the 32-case native text diagnostic; mismatches are reported findings, while failed/incomplete execution fails the harness.

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

## Actual capabilities

| Analyzer | Coverage | Limits |
| --- | --- | --- |
| `nativeTextAnalyzer` | Deterministic heuristic `toxicity`, `harassment`, `hate`, `threat`, `sexual_risk`; parent/quote/target context | Exact `en` or explicitly unknown `und`; no translation or language detection; known quote/criticism/evasion errors |
| `createEnglishProfanityAnalyzer()` | Separate, opt-in 12-token English literal-presence signal | Exact `en`; no semantic context, severity, author-intent, obfuscation, or comprehensive profanity classification |

The native analyzer does **not** advertise `profanity` or `spam_scam`. Mixed requests return `partial` with unavailable categories omitted and listed in `missingCapabilities`; unsupported-only requests produce no findings. The separate literal detector is implemented and has its own diagnostic; see [its exact specification](docs/ENGLISH_PROFANITY.md). Neither adapter implements spam/scam, pixels, OCR, speech recognition, audio, video, persistent actor history, policy, routing, or enforcement.

Native content scoring is the audited extraction already present in this repository, with rule-level evidence instrumentation. Its scores and internal subtype/severity/targeting behavior remain compatible with the frozen legacy diagnostic. This is functional heuristic analysis, not a trained semantic model or a production-accuracy claim. Product criticism, literal animals, reported abuse, sarcasm, implied threats and obfuscation remain known error areas.

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

A local comparison against 40 frozen private legacy fixtures matches all content fields and all five public scores, with zero category or severity differences. Four quoted-report attribution warnings remain. These compatibility results are separate from accuracy. Private examples/reports are not committed or needed for installation/public CI. Use `npm run eval:legacy -- /absolute/path/to/authorized-frozen-report.json` to reproduce locally with authorized fixtures; incomplete/out-of-scope fixtures are reported explicitly and make the CLI fail.

See [evaluation methods and findings](docs/EVALUATION.md), [source provenance and compatibility](docs/PROVENANCE.md), [architecture](docs/architecture/TOXIPLY_CORE.md), and [decisions](docs/DECISIONS.md). This change transfers no further private implementation, fixture, customer data, credential, or operational report. Source provenance for the existing extraction is recorded separately; public repository visibility and a private npm package do not grant a redistribution license.

Phase 2 stops at independently functional, tested text/conversation analysis. Flaggr runtime integration, shadow cutover, broader quality work, media, deployment and publication are separate tasks.
