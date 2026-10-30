# Toxiply

Toxiply is an independent TypeScript content-intelligence library. The Phase 1 foundation provides versioned contracts, strict validation, bounded text/context input, an optional local text-analyzer interface, and explicit execution coverage. Phase 2 adds an opt-in extraction of the existing deterministic native content heuristics. It runs in process without a database, HTTP server, Python, Flaggr, credentials, or an external AI provider.

**No trained model ships here.** The default `analyze()` still returns `unsupported` with `text_analysis: not_configured`. Empty findings mean no assessment was made. Explicitly selecting `nativeTextAnalyzer` runs frozen heuristics with known errors; it does not establish production accuracy, calibration, or correct quote attribution. The Phase 1 contract fixtures use fixed synthetic scores.

## Run locally

Requires Node.js 22 or later and npm. From this checkout:

```sh
npm ci
npm run check
```

`check` typechecks source/examples, builds the library, runs contract/error/native regression tests, and executes the unconfigured and native examples. CI runs the same command on Node 22 and 24. Individual commands include `npm run build`, `npm test`, `npm run example`, and `npm run example:native`.

## Minimal usage

The package is currently private and unpublished. After building this checkout, its ESM self-reference is available to the [usage example](examples/text.mjs):

```js
import { analyze, SCHEMA_VERSION } from '@eonhive/toxiply';

const result = await analyze({
  schemaVersion: SCHEMA_VERSION,
  requestId: 'example-1',
  content: { kind: 'text', text: 'Thanks for the thoughtful reply.' },
  categories: ['harassment'],
  context: { languageHint: 'en' },
});

console.log(result.status);              // unsupported
console.log(result.findings);            // []
console.log(result.missingCapabilities); // [{ capability: 'text_analysis', reason: 'not_configured' }]
```

## Optional native extraction

```js
import { createAnalyzer, nativeTextAnalyzer, SCHEMA_VERSION } from '@eonhive/toxiply';

const native = createAnalyzer(nativeTextAnalyzer);
const result = await native.analyze({
  schemaVersion: SCHEMA_VERSION,
  requestId: 'native-1',
  content: { kind: 'text', text: 'I will hurt you.' },
  categories: ['threat', 'harassment'],
  context: { languageHint: 'en' },
});
```

The adapter supports `toxicity`, `harassment`, `hate`, `threat`, and `sexual_risk`. It does not implement `profanity` or `spam_scam`; mixed requests return partial coverage, and unsupported-only requests return no scores. Explicit supported hints are `en` and `und`. Accepting `und` preserves opt-in English heuristic execution when language is unknown; it is not language detection. Other hints, including region tags, remain unsupported under the core's exact-match rule.

`context.replyTarget` optionally accepts `parent_author`, `group`, `self`, or `unknown`. This is a bounded semantic hint about the message's target, not an actor identifier or trusted role. The native adapter uses parent/quote/target context as the extracted heuristics did. Known criticism, quoting, sarcasm, and evasion weaknesses are retained rather than tuned during extraction.

The optional reply-target field requires core `0.2.0` or later. Older strict V1 validators do not accept that new property; existing request shapes remain valid without it.

Evidence spans identify whole assessed input fields because the legacy algorithm does not provide exact token attribution. They do not assert that every character in a span is harmful or that quoting implies endorsement. Positive findings reference those assessment spans; assessed zero scores have no invented evidence.

Public provenance records the composite `native_content` analyzer at `native-content-heuristic-v2`. Its frozen lanes are `lexical-heuristic-v2`, `semantic-heuristic-v2`, `conversation-heuristic-v2`, and `toxiply-aggregator-v2`. Internal compatibility assessment retains subtype, severity, heuristic confidence, escalation and lane versions for parity checks; those extra fields are not a new public result contract. Flaggr compatibility mapping remains Phase 3 work. See [provenance and parity](docs/PROVENANCE.md).

## API and coverage

- `analyze(request: unknown): Promise<AnalysisResult>` validates a request without configuring an analyzer.
- `createAnalyzer(textAnalyzer?: TextAnalyzer): ContentAnalyzer` creates an independent instance with one optional local analyzer.
- `analysisRequestSchema` and `analysisResultSchema` expose runtime validation. Public TypeScript types are inferred from these contracts.
- `requestJsonSchema` and `resultJsonSchema`, also shipped as `schemas/request.v1.json` and `schemas/result.v1.json`, expose portable JSON Schema Draft 2020-12 structure. Run `npm run schemas:write` after intentional contract changes. Tests detect stale exports and validate fixtures with an independent JSON Schema validator.

| Status | Meaning |
| --- | --- |
| `completed` | All requested categories and supplied semantic context were assessed by the configured analyzer. This is an execution status, not a safety or accuracy claim. |
| `partial` | Some categories were assessed, but categories or semantic context were unavailable. Check `missingCapabilities`. |
| `unsupported` | A valid request could not be assessed: no analyzer, no matching categories, or unsupported/unknown language. No scores or model versions are fabricated. |
| `failed` | Invalid input/configuration, an analyzer exception, or invalid analyzer output. No findings are retained. |

Each result includes schema/taxonomy/engine versions, the correlation ID, findings, evidence, coverage, missing capabilities, and a structured error or `null`. Invalid requests preserve a valid correlation ID; otherwise it is `null`. Error codes and bounded issue paths are returned without content or exception messages.

The `toxiply.categories.v1` taxonomy contains `toxicity`, `harassment`, `hate`, `threat`, `sexual_risk`, `profanity`, and `spam_scam`. These are request vocabulary, not shipped capabilities. Requested categories must be explicit and unique. Only assessed categories appear in findings; an unavailable category is never represented by a zero score.

Scores are finite analyzer signals in `[0, 1]`, not calibrated probabilities. `confidence.calibrated` is always `false`. Each invoked analyzer supplies its own ID and version in `modelVersions`; an entry records invocation even if it failed. A descriptor can identify a deterministic algorithm without implying it is a trained model. The core has a separate `engineVersion`.

## Local analyzer contract

Implement the exported `TextAnalyzer` interface and pass it to `createAnalyzer()`:

```ts
interface TextAnalyzer {
  readonly descriptor: TextAnalyzerDescriptor;
  analyze(request: AnalysisRequest): TextAnalysis | Promise<TextAnalysis>;
}
```

The descriptor declares `id`, `version`, supported `categories`, supported `languages`, and `supportsContext`. The core passes only supported requested categories. The analyzer must return exactly one finding for each passed category, plus evidence. It must throw on execution failure; it cannot silently omit an advertised category. Invalid output becomes `failed: invalid_analyzer_output`. No provider plugins are included. The optional native implementation uses the same local interface as caller-supplied analyzers.

Language tags use lowercase BCP 47 style syntax and match exactly, without region fallback. `languageHint` is caller supplied; the core does not detect or verify language. An absent hint becomes `und` (unknown), and an analyzer must explicitly declare `und` to accept it. Coverage language describes the accepted hint, never detected language or measured language quality.

When semantic context is supplied to an analyzer that does not support it, the core removes `parentText`, `quotedText`, and `replyTarget` from that analyzer's input, returns partial coverage, and reports `semantic_context` as missing. Supported context is passed unchanged. The analyzer owns semantic interpretation, including quote/author attribution; the core only checks structural provenance.

Analyzers receive a detached request. They return:

```ts
interface TextAnalysis {
  findings: Array<{ category: Category; score: number; evidenceIds: string[] }>;
  evidence: Array<{
    id: string;
    code: string;
    source: 'text' | 'parentText' | 'quotedText';
    start: number;
    end: number;
  }>;
}
```

Evidence uses half-open UTF-16 offsets `[start, end)` into the unchanged source field. Spans must be nonempty, in bounds, and must not split a surrogate pair. Evidence IDs and references must be unique and resolve; every evidence item must be referenced. Positive scores require evidence. A zero score can have no evidence but still requires actual category coverage and analyzer provenance. At most 64 evidence items are accepted.

A local analyzer is trusted application code. The core validates its declared capabilities and returned data; it cannot verify that inference or semantic interpretation is correct. Execution time, cancellation, and resource isolation of caller-supplied code remain the host's responsibility.

## Input limits and validation

Unknown properties, wrong versions, non-text kinds, coercions, empty/whitespace-only text, duplicate/unknown categories, and oversized inputs are rejected. Non-text request shapes return `failed: invalid_request`; this V1 contract defines only text. Text requests lacking an applicable analyzer return `unsupported`.

| Field | Maximum Unicode code points |
| --- | ---: |
| `content.text` | 16,000 |
| `context.parentText` | 4,000 |
| `context.quotedText` | 4,000 |
| Combined parent and quoted text | 6,000 |

Input is never truncated, fetched, normalized, persisted, or logged by the core. Context is limited to parent text, quoted text, an optional reply-target enum, and a language hint. The native adapter normalizes its own working copy as its frozen algorithm requires; the original input/evidence fields remain unchanged. Request IDs are bounded ASCII correlation identifiers. Workspace identity, actor history, enforcement, routing, and tenant policy do not belong in this contract.

The JSON Schemas cover structural and per-field constraints. Runtime validation additionally enforces unique categories, combined context bounds, evidence references, and status/coverage consistency. Source-relative spans and requested-versus-assessed coverage are checked by the execution core because they require the original request. Other language implementations must enforce these documented semantic checks too.

## Scope and provenance

Phase 1 source and fixtures were authored independently. Phase 2 adapts the specifically audited EonHive native content modules listed in [the provenance record](docs/PROVENANCE.md); no private dataset, customer state, credentials, deployment files, provider implementation or platform modules were copied. A private 40-case comparison establishes native diagnostic parity only, not Flaggr runtime/decision/action parity or quality improvement. The only runtime dependency is Zod; TypeScript and the independent JSON Schema validator are development tools.

Image/pixel analysis, OCR, speech recognition, acoustic analysis, video, learned semantic classifiers, multilingual quality claims, platform context engines, storage, network services, and enforcement remain outside this package. Text supplied by a caller is only text; its presence does not establish that audio or pixels were analyzed.

Licensing and publication rights remain undecided. `private: true` prevents accidental npm publication, and `UNLICENSED` does not grant an open-source license. Any future reuse of private source requires provenance, licensing, and publication-rights review first.

See the [core architecture](docs/architecture/TOXIPLY_CORE.md), [decisions](docs/DECISIONS.md), [build status](BUILD_STATUS.md), and [next steps](NEXT_STEPS.md). No Flaggr runtime has been switched to this library.
