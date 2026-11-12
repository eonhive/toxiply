<!--
Company: EonHive Inc. | Title: T7A optional model text adapter
Purpose: Define inference configuration, evidence validation, privacy and actual verification limits.
Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
Notes: Vibe coded with Codex.
-->
# Optional model-backed text analysis — T7A

`createModelTextAnalyzer(options)` implements the existing `TextAnalyzer` interface.
Use it through `createAnalyzer()` for V1 request validation, capability filtering and
result validation. No model is invoked by importing the package or calling default
`analyze()`. All existing deterministic analyzers, including T6B v2, remain unchanged.
This package ships no model weights, trained classifier or mandatory inference service.

T7B adds a separate [private benchmark runner](MODEL_BENCHMARK.md), not another inference
framework. The review of merged PR #13 repaired acceptance of expired results after a
client blocked the event loop: monotonic checks now reject late results after inference
and validation, and deadline aborts use the safe reason `model_deadline_exceeded`.
Normal cleanup aborts remain distinct. Adapter provenance is now `model-json-v2+<hash>`;
strict output validation and V1 are unchanged. Live benchmarking remains NOT_RUN.

## Select an explicit client and capability profile

```js
import { createAnalyzer, createModelTextAnalyzer, createChatCompletionsClient } from '@eonhive/toxiply';

const client = createChatCompletionsClient({
  endpoint: 'http://127.0.0.1:11434/v1/chat/completions',
  allowedOrigins: ['http://127.0.0.1:11434'],
  allowInsecureLoopback: true,
  // apiKey: process.env.PRIVATE_MODEL_API_KEY, // only if required by your server
});
const engine = createAnalyzer(createModelTextAnalyzer({
  modelId: 'your-installed-model',
  modelVersion: 'your-frozen-weight-and-config-revision',
  client,
  categories: ['harassment'],
  languages: ['en'],
  supportsContext: true,
  timeoutMs: 30000,
  maxResponseBytes: 65536,
}));
const result = await engine.analyze({
  schemaVersion: 'toxiply.analysis.v1', requestId: 'model-demo',
  content: { kind: 'text', text: 'You are an idiot.' },
  categories: ['harassment'],
  context: { languageHint: 'en', parentText: 'Can you explain the issue?', replyTarget: 'parent_author' },
});
```

Names above are configuration placeholders, not installed or recommended model claims.
The caller must select an authorized model, review its license/usage rights and evaluate
each advertised capability. Declaring categories, languages or context is a caller
attestation; the adapter verifies execution contracts, not the model's competence.
No real model is validated by this PR. Only English fixture execution was exercised.

The supported adapter taxonomy is `toxicity`, `harassment`, `hate`, `threat`,
`sexual_risk`, `spam_scam`. Configure only the subset actually provided by your model;
there is no default all-category profile. `profanity` is outside this adapter. A model
with one generic toxicity output cannot claim harassment, hate or threats from it.
Language hints match exactly. An absent hint is `und`, never inferred English;
an unlisted language/category does not invoke inference. Explicit `und` support, if
declared, means unknown-language execution, not verified detection or multilingual quality.

With `supportsContext: true`, the complete bounded V1 parent/quote/reply-target fields
are passed unchanged as data. Otherwise the existing core strips them, assesses current
text and returns `partial` with missing semantic context. Unsupported categories are
omitted rather than assigned zero. The raw adapter also rejects incompatible requests.

## Typed client and strict response

`ModelInferenceClient` has an `id`, `version`, and async
`infer(input, { signal, maxResponseBytes }): Promise<string>` method. Input contains
configured model ID/version, fixed adapter instructions, the detached V1 request and
the JSON response schema. Return one JSON string conforming to that schema; no Markdown,
explanations or score repair. Clients are explicitly injected trusted application code.
Version custom clients when their prompting, decoding, endpoint or mapping changes.

The structured output envelope requires exactly these keys:

```json
{
  "modelId": "your-installed-model",
  "modelVersion": "your-frozen-weight-and-config-revision",
  "requestId": "model-demo",
  "language": "en",
  "context": "analyzed",
  "findings": [{ "category": "harassment", "score": 0.8, "evidenceIds": ["e1"] }],
  "evidence": [{ "id": "e1", "code": "model.source_span", "source": "text", "start": 0, "end": 16, "quote": "You are an idiot" }]
}
```

This is a fabricated protocol illustration, not a live prediction. The score is an
uncalibrated signal, not a probability, severity policy or action recommendation.
There must be exactly one finding per requested/selected category, in request order.
No missing/extra/duplicate categories, coercion, unknown keys or partial model result
is accepted. Echoed model ID/version, request ID, language and context must agree with
the invocation. A model error/refusal or incomplete result becomes a failed invocation,
not a benign score. The V1 error code is the existing `analyzer_failed`; detailed model
failure reasons are intentionally not exposed through a new schema or raw error text.

Each positive finding needs relevant evidence references, with unique IDs and real
nonempty half-open UTF-16 source spans, at most 64 witnesses. The required `quote` must
exactly equal the original `text`, `parentText` or `quotedText` slice. Unknown sources,
broken surrogate boundaries, mismatched quotes, fabricated offsets, orphan witnesses
and zero-score evidence links are rejected. The adapter removes the extra `quote`
before returning the unchanged public V1 evidence shape; it never searches for a
replacement span or manufactures evidence. The core revalidates the returned result.

**Semantic limit:** exact substring validation cannot prove that a real substring is
relevant, author-endorsed, or correctly classified. A model can return a semantically
wrong but structurally valid witness. Human evidence adjudication and independent
evaluation remain necessary. Injection-resistant instructions and schema validation
also cannot guarantee that a model ignores malicious text. Source fields are separate
untrusted JSON data, not system messages; no tools or moderation actions are provided.

## Reference transport and local servers

`createChatCompletionsClient()` uses Node 22+ built-in `fetch`; no SDK dependency.
It implements a bounded subset of the chat-completions protocol: a fixed system
instruction, one JSON data message, `temperature: 0`, `stream: false`, and a strict
`response_format: json_schema`. It requires one assistant choice, exact outer model
ID, `finish_reason: stop`, no refusal/tool/function call, and JSON content matching
the inner protocol above. Extra provider envelope metadata is ignored; inner model
output is strict. Unsupported structured-output servers fail rather than silently
falling back to free text or parsing Markdown. Provider aliases must echo the configured
model ID exactly; use a compatible model name/configuration, not a guessed mapping.

For example, [Ollama documents local chat-completions and response-format support](https://docs.ollama.com/api/openai-compatibility).
Compatibility is server/model dependent; no Ollama server or weights were installed,
downloaded, invoked or benchmarked here. This reference does not implement a new server.
The owner runs an independently authorized compatible endpoint. Models lacking structured
evidence output are unsupported by this adapter even if they produce useful labels.

Runnable example (replace placeholders with your approved installed configuration):

```sh
TOXIPLY_MODEL_ENDPOINT=http://127.0.0.1:11434/v1/chat/completions \
TOXIPLY_MODEL_ALLOWED_ORIGIN=http://127.0.0.1:11434 \
TOXIPLY_MODEL_ALLOW_LOOPBACK=true \
TOXIPLY_MODEL_ID=your-installed-model \
TOXIPLY_MODEL_VERSION=your-frozen-revision \
npm run example:model
```

With missing endpoint/model/version, the example explicitly prints `liveModel: NOT_RUN`
and makes no model call. The example prints only status, coverage, fingerprint and
scores; it does not print source/evidence text, raw response, endpoint or credentials.
Its complete configured request flow is tested against an isolated local mock server.

## Privacy, endpoint policy and limits

Endpoint/model configuration is trusted application configuration, never accepted from
AnalysisRequest or extracted from content links. The exact endpoint origin must appear
in `allowedOrigins`. HTTPS is required except explicitly enabled literal loopback HTTP
(`127.0.0.1` or `[::1]`); even `localhost` is rejected for HTTP to avoid hostname ambiguity.
No URL credentials, query secrets or fragments are accepted. Redirects are rejected,
cookies omitted, no retries/fallback URL requests occur, and no URL found in text is
fetched. An origin list is not DNS/private-network isolation for HTTPS; applications
must control configuration, DNS and egress rather than exposing this factory to users.

The optional API key is a captured Bearer header, kept out of source and public results.
The library never logs input/model responses/provider exceptions. No credentials or
source snippets are included in error messages. Results intentionally include evidence
offsets and scores; applications own logging/redaction, storage and access control.
Hosted or remotely configured endpoints receive the selected text/context. Review their
retention, training and jurisdiction terms; local servers may also log or forward data.
The library cannot control endpoint internals or promise that a caller's server is local.

Existing text/context bounds are retained without truncation. Timeout is explicitly
configured, 1–120,000 ms, covering awaiting inference/HTTP headers/body; a race rejects
even clients ignoring abort. Output cap is explicit, 1–1,048,576 UTF-8 bytes. The reference
client applies it to the entire decompressed response envelope while reading, then the
adapter also checks the inner JSON string. HTTP failures, invalid UTF-8, oversized
streams/Content-Length, network errors and deadlines fail without retained findings.
In-flight HTTP is aborted on completion/failure; no transparent retries occur.
Trusted custom clients can still allocate excessively or block the JS thread before
returning; cancellation cannot preempt synchronous caller code. Schema parsing is
bounded by the configured input/output limits, not isolated in another process.

Model inference may incur endpoint charges, GPU/RAM/CPU costs and latency. Byte/time
limits are not billing caps, token budgets, server-side cancellation guarantees or
performance benchmarks. Temperature zero does not guarantee reproducible model output.
Only fixture tests are deterministic; no production calibration or accuracy is claimed.

## Provenance within unchanged V1

V1 permits at most one restricted analyzer ID/version pair and cannot directly expose
arbitrary provider IDs, prompt provenance or weight digests. `modelVersions.model_text`
is `model-json-v2+` plus the first 48 hex SHA-256 characters over adapter version,
non-secret model/client ID+version, declared capabilities and execution limits.
The same configuration has a stable fingerprint; changes produce distinct provenance.
It does not attest model identity, weights, server honesty or hidden generation settings.
The model ID/version echoes are checked for consistency, not independently authenticated.
Retain exact configuration and approved model/weight revision outside V1 when recording
evaluations. Secrets are not fingerprinted. Endpoint/provider changes with unchanged
attested model/client metadata may not change the fingerprint; record them externally.
A future versioned contract could add full model/weight/prompt/endpoint provenance;
T7A does not silently extend V1 to represent it. Protocol instructions, mappings or
validation changes require a new adapter version; custom clients must version likewise.

## Diagnostic and validation evidence

Run `npm run eval:model-adapter` (also in `eval:all` and `check`). It uses existing
versioned evaluation tools, six distinct category mappings and explicit canned responses.
Dataset [model-adapter.v1.json](../eval/model-adapter.v1.json), version 1.0.0, SHA-256:
`92d617253b5529c17fb667fff22b5ce4600a4e6116889a41ab8968621b8bdd46`.
[Response fixtures](../eval/model-adapter.responses.v1.json) SHA-256:
`30605e2213cfee47de9903b16584f13af23bb09d7a70cb78c34976410a4d51e6`.
Both are public synthetic development data authored with Codex, with provisional
labels, not independent/held-out evidence. The report is explicitly marked
`CANNED_FIXTURE_REPLAY_NOT_MODEL_QUALITY`, `liveModel: NOT_RUN`.

Fourteen requests yield 11 completed, 1 partial-category and 2 unsupported-language
results. Eleven whole cases are assessed: 8 fixture TP, 3 fixture TN, 0 FP/FN. These
counts merely confirm intentional response replay; the corresponding fixture rates
are **not model precision/recall**. Nine witnesses pass structural audit; semantic span
metrics are null. Direct/reported abuse, criticism, direct/implied threats, scam/warning,
endorsement, sexual risk, hate and bounded parent context are exercised, without any
claim that a trained model understood them. Missing/unsupported coverage never becomes
a benign score. The model-response fixture hash is recorded alongside the dataset hash.

Tests independently inject malformed/partial output, model/coverage mismatches, fake
quotes, Unicode offsets, deadline/network failures and private error text. An isolated
loopback chat server exercises actual HTTP request/response processing and the example;
it is a test fixture, not a model or product server. [Build status](../BUILD_STATUS.md)
records exact baseline/final checks and candidate-only test coverage.

Live-model inference, live model-versus-heuristic quality comparison, calibration,
independent human review and held-out evaluation are **NOT_RUN**: no approved endpoint,
model credentials/weights or independently reviewed model corpus was supplied. No
provider accuracy results are invented. Existing frozen diagnostic data and deterministic
scores remain unchanged. Include these exposed fixtures in future leakage audits.

Next bounded phase: freeze one owner-approved model/weight/client configuration and
run both model and relevant unchanged heuristics on the same eligible private reviewed
inputs. Record actual evidence/category/coverage errors, cost and latency separately;
keep unsupported categories/context out of paired quality denominators. No model is
promoted by T7A. Rollback selects an existing deterministic analyzer; removing the
optional factory/client, example/diagnostic and scripts requires no data migration.
