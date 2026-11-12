<!--
Company: EonHive Inc. | Title: T7B optional real-model benchmark
Purpose: Define authorized configuration, reproducible comparisons and honest missing measurements.
Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
Notes: Vibe coded with Codex.
-->
# T7B: first real-model benchmark preparation

Review of merged PR #14 found that a client mutating its passed limits object could
change benchmark audit bounds or hide a deadline event, although T7A still rejected
failed inference correctly. The wrapper now snapshots the original byte limit and
abort signal before calling the client, just as it already snapshots source text.
Both response auditing and deadline listener cleanup use those original values.
Three synthetic regression tests cover raised/lowered limits and replaced signals.
This is an accounting repair, not a model/score/validation or report-schema change.
Previously recorded runs using clients that mutate these arguments need rerunning;
the standard canned replay remains unchanged. Custom clients remain trusted code,
not sandboxed by these snapshots. Real-model execution is still NOT_RUN.

Outcome: **runner implemented and mock-tested; real-model execution NOT_RUN**.
The owner explicitly confirmed that no approved model configuration is available and
requested runner-only work. No weights were downloaded, external provider contacted,
real model installed or trained, or customer/Flaggr data accessed. There is no real
accuracy, latency, token, cost or model resource result to report.

The runner reuses T7A inference and T3/T4 dataset/evaluation tools. It introduces no
new inference framework, API server, runtime router, public analysis schema, database
or dependency. All deterministic scorers, T6B v2, frozen labels and default behavior
remain unchanged. Benchmark code stays in `eval/`, outside package exports/contents.

## T7A review repair

PR #13 was already merged at `b2a60c8` when review began. Review reproduced an expired
deadline being accepted as completed when a custom client blocked the event loop and
returned a resolved result before the overdue timer ran. A regression failed on T7A.
The adapter now checks the monotonic deadline after inference and validation; late
results fail once control returns. This cannot preempt synchronous trusted client code.
Timeout aborts carry the safe static reason `model_deadline_exceeded`; normal cleanup
aborts do not. This permits benchmark timeout accounting without parsing error text or
weakening strict model validation. Adapter provenance is now `model-json-v2+<hash>`.
The prompt text and category/evidence/identity validation rules are unchanged.

## Commands and required inputs

```sh
npm ci
npm run build
npm run benchmark:model
npm run benchmark:model -- mock
```

The default command describes requirements and reports NOT_RUN. `mock` always uses
the repository's canned fixture client, never environment endpoints or credentials.
It prints only a compact explicitly mock summary. It is included in `eval:all` as
`eval:model-benchmark`; CI cannot accidentally benchmark a live provider.

For a genuine run, an owner must provide all of the following privately:

| Input | Required record |
| --- | --- |
| Model | Exact ID/version, frozen checkpoint or weight digest, quantization and configuration |
| Rights | Model license ID/reference and actual processing/use permission record |
| Approval | Real approver/time, model/endpoint/data-use authorization and privacy/retention/access review |
| Endpoint | Approved exact URL/origin list, loopback opt-in if needed, optional credential environment-variable name |
| Capability profile | Evaluated category/language subset and actual bounded-context support |
| Client/prompt | Pinned `chat-completions-json` / `chat-json-v1`, `model-json-v2` and current instruction SHA-256 |
| Runtime | Server/software/hardware/configuration record; distinguish declarations from observations |
| Dataset | Eligible V1 dataset ID/version, exact byte hash, complete labels, source/rights and frozen reference hashes |
| Limits/output | Deadline, response-byte cap, maximum cases and existing approved private output directory |

None of these real inputs has been supplied. Filling metadata cannot prove rights,
model identity, weight revisions, privacy approval or reviewer independence. A live
configuration plus `run --execute` is the caller's explicit authorization to submit
the bound inputs. Never construct it from an untrusted request or source message.
Do not submit customer data without actual rights/privacy/access approval.

## Versioned configuration format

Format `toxiply.model-benchmark.v1` is a strict repository-only JSON manifest. Live
configs must be in ignored `.local/` or outside Git, never another repository. Symlinks
are resolved. Configs are limited to 64 KiB; unknown fields (including inline API keys)
are rejected. Credentials are read only from the named environment variable during
an explicitly executed live run. Model weights/configuration artifacts are not loaded
or fetched by this command.

The following is an **intentionally invalid, unapproved template**, not authorization.
Replace every placeholder with real frozen records; approval booleans may become true
only after actual approvals. `benchmark:model describe` prints the current prompt hash.

```json
{
  "schemaVersion": "toxiply.model-benchmark.v1",
  "mode": "live",
  "benchmarkId": "first-approved-english-run",
  "authorization": {
    "approvedBy": "REQUIRED_REAL_APPROVER",
    "approvedAt": "REQUIRED_REAL_UTC_TIMESTAMP",
    "modelUseAuthorized": false,
    "endpointUseAuthorized": false,
    "dataUseAuthorized": false,
    "permissionRecord": "REQUIRED_PRIVATE_RECORD",
    "privacyRetentionAccessRecord": "REQUIRED_PRIVATE_RECORD"
  },
  "model": {
    "id": "REQUIRED_MODEL_ID",
    "version": "REQUIRED_FROZEN_VERSION",
    "checkpointRevision": "REQUIRED_WEIGHT_REVISION_OR_DIGEST",
    "quantization": "REQUIRED_QUANTIZATION_OR_EXPLICIT_NONE",
    "configuration": "REQUIRED_MODEL_CONFIGURATION",
    "license": {
      "identifier": "REQUIRED_LICENSE",
      "reference": "REQUIRED_TERMS_REFERENCE",
      "usePermissionRecord": "REQUIRED_PRIVATE_PERMISSION"
    }
  },
  "client": {
    "id": "chat-completions-json",
    "version": "chat-json-v1",
    "promptRevision": "model-json-v2",
    "promptSha256": "REQUIRED_CURRENT_PROMPT_HASH"
  },
  "endpoint": {
    "url": "REQUIRED_APPROVED_ENDPOINT",
    "allowedOrigins": ["REQUIRED_APPROVED_ORIGIN"],
    "allowInsecureLoopback": false,
    "credentialEnv": null
  },
  "profile": {
    "categories": ["harassment"],
    "languages": ["en"],
    "supportsContext": false
  },
  "execution": { "timeoutMs": 30000, "maxResponseBytes": 65536, "maxCases": 20 },
  "dataset": {
    "id": "REQUIRED_DATASET_ID",
    "version": "REQUIRED_DATASET_VERSION",
    "sha256": "REQUIRED_DATASET_HASH",
    "referenceSha256": ["REQUIRED_REFERENCE_HASHES"]
  },
  "runtime": {
    "server": "REQUIRED_SERVER_VERSION",
    "hardware": "REQUIRED_HARDWARE_CONFIGURATION",
    "software": "REQUIRED_RUNTIME_CONFIGURATION",
    "notes": "REQUIRED_COLLECTION_AND_EXECUTION_NOTES"
  }
}
```

Dataset/profile declarations do not automatically certify independent review or model
competence. Only the six T7A categories can be configured. Exact language hints apply;
`und` is unknown, not inferred English. Context-unavailable results remain partial and
outside context-dependent quality denominators. There is no automatic model router.

Use existing `toxiply.text-eval.v1` labeled inputs; this phase adds no unlabeled format.
Exposed synthetic data remain development regardless of schema approval declarations.
Legacy diagnostic formats must first be legitimately represented in V1, with preserved
provenance; the benchmark does not silently reinterpret them as approved data.

## Freeze and validate before execution

The CLI automatically includes six exposed compatible development references:
native, contextual attribution, review example, T6A spam/scam, T6B spam attribution,
and T7A model-adapter inputs. Supply additional approved compatible references using
repeated `--reference`. The manifest must bind the exact set of reference hashes.
Separate lexical-profanity and response-fixture JSON formats need manual leakage audits;
the V1 overlap checker does not parse them. Check paraphrases/context leakage separately.

The existing dataset CLI can show the dataset and six reference hashes before creating
the private benchmark manifest:

```sh
node eval/run-review.mjs validate /private/approved-dataset.json \
  --reference eval/english-spam-scam.v1.json \
  --reference eval/spam-scam-attribution.v1.json \
  --reference eval/model-adapter.v1.json
node eval/run-model-benchmark.mjs describe
node eval/run-model-benchmark.mjs validate \
  --config /private/approved-benchmark.json --dataset /private/approved-dataset.json
```

Validation checks schema, hashes, IDs/versions, reference membership, case budget,
profile/client/prompt configuration and endpoint policy without reading credentials or
invoking inference. Held-out inputs additionally use existing freeze/overlap validation;
declarations alone are not independent collection/review proof. No supplied data is
upgraded to held-out. Do not discard difficult examples to make a run look better.

Execute only after genuine approval, with an existing private output directory:

```sh
npm run benchmark:model -- run --execute \
  --config /private/approved-benchmark.json \
  --dataset /private/approved-dataset.json \
  --output /private/benchmark-results
```

No real configuration is provided by these placeholders. There are no retries, model
downloads or server startup. Calls are sequential, once per supported case, with a
required `maxCases` limit of 1–1000. Excess input is rejected, never truncated or sampled.
Actual calls can be fewer when declared language/category coverage is unavailable.
Time/byte/case limits are not billing caps or server-side cancellation guarantees.

The existing immutable private artifact writer checks output location before inference
and writes a `0600` plan receipt. The completed report is written with exclusive create
and a UUID run ID, also `0600`. Nothing overwrites prior versions. A planned receipt
without a report means interrupted/failed orchestration, not a successful benchmark.
Application permissions, directory/backup access and retention remain owner duties.
Stdout contains only an artifact/hash/execution receipt; errors use bounded codes,
never config paths, response text, credentials or arbitrary provider exception details.
Raw model responses are never persisted. Plans/reports contain sensitive IDs, labels,
declared runtime/permission records and endpoint metadata: keep them out of public Git.
Runs with inference/evidence failures still save their report and exit nonzero.

## Report interpretation

`toxiply.model-benchmark-report.v1` records exact config/dataset/reference hashes, full
non-secret private provenance, timestamps, original category scores, status/coverage,
missing capabilities and failures through the existing evaluator. Live transport calls
are marked ATTEMPTED, not proof of actual model weights executing; zero calls are
NOT_RUN. Mock reports always mark real-model execution NOT_RUN.

- Execution: requested/invoked/completed/partial/unsupported/failed counts; deadline,
  transport and structural-schema failure counts. Failure counts can overlap. Schema
  compliance is structural; T7A additionally rejects identity/coverage/reference errors.
- Evidence: audit bounded response spans before T7A discards rejected results, using
  the existing schema/source validator and literal quote matching. Invalid observed
  spans are counted; missing/malformed/oversized responses remain unaudited with null
  per-call span counts. Accepted V1 evidence is separately audited by the evaluator.
  These counts never turn failed responses into category scores or quality negatives.
- Relevance/attribution: optional supplied span annotations yield alignment precision/
  recall; category FP/FN IDs, reporting/warning/criticism/endorsement groups and slices
  expose label disagreements. Without adjudication, unrelated-evidence count is null,
  not invented zero. A literal but irrelevant witness may pass T7A; a valid zero score
  caused by prompt injection may also pass. Mock injection tests explicitly demonstrate
  this limit. No model injection-resistance result is claimed.
- Quality: full per-engine reports are marginal execution/quality views. Use each
  comparison's `paired.categories` for TP/TN/FP/FN and precision/recall on **only jointly
  assessed categories**, with comparable IDs. Unsupported/failed/context-missing labels
  are excluded, never counted benign. A zero common-category denominator has no quality
  comparison. All five deterministic analyzers are evaluated offline on the same inputs;
  model results are cached, so comparisons never rerun inference or incur extra model
  calls. Existing whole-case/category deltas remain available from the paired evaluator.
- Latency: per-case client-side V1 analyze durations and nearest-rank p50/p95 for invoked
  model/baseline calls, plus same-case common-category latency summaries. Failed call
  latency is retained. Unsupported requests do not enter invoked-call percentiles.
  There is no warmup or hidden retry. Work/category counts can differ, so these are
  observed latency differences, not equal-workload speed claims. Mock timing is not
  model performance. Timing/resource fields legitimately vary between runs.
- Resources: measured client-process CPU user/system microseconds, before/after RSS/heap,
  Node/platform/architecture, CPU count and host total RAM. These include evaluator/client
  overhead, not model GPU/CPU/RAM. Server CPU/GPU/RAM observations are null. Declared
  runtime configuration is not a measured observation. T7A's string-only client drops
  provider usage telemetry, so tokens and cost remain null with an explicit reason;
  no estimate or invented pricing is used. A future telemetry extension needs separate
  scope rather than silently altering V1 or weakening validation.

## Actual evidence and remaining work

No approved real configuration exists. Live inference, real model output reliability,
real model-versus-heuristic accuracy/latency, token/cost/resource telemetry, calibration,
independent review and held-out model evaluation are **NOT_RUN**.

The explicitly canned mock run reuses the unchanged T7A 14-case synthetic dataset:
11 completed, 1 partial, 2 unsupported; 12 fixture calls; no failed calls/timeouts;
9 valid and 0 invalid observed spans. It has 10 common-category cases with native/
contextual, 2 with each spam analyzer and 0 with profanity. These are adapter/benchmark
mechanics, not a real model comparison or performance result. Mock quality counts are
replayed labels/responses and cannot be reported as independent accuracy.

Tests cover private manifest binding/storage, strict output failures and invalid spans,
cached inference, correct paired denominators, deadlines including blocking/late clients,
prompt-data separation, annotated unrelated evidence, safe errors and mock CLI endpoints.
The CLI integration's approval records are explicitly fictional test declarations for
a loopback mock, not an approved real model. [Build status](../BUILD_STATUS.md) records
exact final PASS/FAIL/NOT_RUN and focused test coverage. No dataset labels are changed.

Recommended next phase: supply one actually approved frozen English model/client profile
and rights-approved development probes, then execute this runner and triage actual
identity/schema/UTF-16/attribution failures before proposing a narrow improvement.
Use independently reviewed/held-out data only when eligible real records exist. Do not
retrain, promote defaults, weaken T7A or infer safe enforcement from fixture tests.
Rollback removes the optional evaluation runner/scripts; deterministic analyzer/data
contracts need no migration. The T7A deadline repair is independently reversible but
should remain tested. No merge, publication, deployment or Flaggr cutover is authorized.
