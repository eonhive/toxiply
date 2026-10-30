# Independent Toxiply core

Updated: 2026-10-30 · Status: Phase 1 implementation specification

This document describes the standalone `@eonhive/toxiply` package. It supersedes older local reference material that placed platform history and routing inside Toxiply. The reusable core accepts current text and bounded semantic context. Applications own persistent identity/history, tenant policy, workflow, and actions.

## Package boundary

One TypeScript library executes in the caller's process. It has no platform imports, storage, service endpoints, required network access, or mandatory inference provider. Zod is the only runtime dependency. There is no built-in classifier in Phase 1 and no claim of legacy behavior parity.

```text
unknown request
  -> strict versioned request validation
  -> select declared category/language/context capabilities
  -> optional local text analyzer
  -> validate category completeness and source-relative evidence
  -> versioned result with coverage, provenance, and missing capabilities
```

The public API is `analyze()` for the unconfigured core and `createAnalyzer()` for one caller-supplied `TextAnalyzer`. No plugin registry, multi-provider orchestration, networking layer, or persistent state is needed. An adapter is trusted local code, not a security sandbox; hosts own its execution limits.

## Contract and status

The schema identifier is `toxiply.analysis.v1`. Category vocabulary has its own `toxiply.categories.v1` identifier. Engine and analyzer versions are independent of those identifiers. Breaking contract changes require a new schema version; a newer engine revision can still emit a compatible V1 result.

Categories are explicitly requested. The core computes coverage from valid output and never inserts missing-category zeros. Missing analyzers/categories/languages/context have machine-readable metadata. A declared language hint is not language detection. Missing hints are `und`; matching is exact. Unsupported semantic context is excluded from the adapter input and reported.

- `completed`: valid findings for every requested category and supplied semantic context.
- `partial`: valid findings with explicit unavailable categories or semantic context.
- `unsupported`: valid input but no applicable analyzer execution.
- `failed`: request/configuration validation, execution, or output-validation error.

Unsupported and failed results carry no findings or evidence. Provenance records only invoked analyzers, including failed invocations. Invalid input never invokes an analyzer. Exception messages and content are not echoed in error results.

## Validation ownership

`src/contracts/schemas.ts` defines runtime schemas and inferred types. Checked-in Draft 2020-12 artifacts under `schemas/` are deterministic structural exports, validated with Ajv in tests. Runtime refinements cover aggregate context size, uniqueness, evidence references, and status/coverage consistency. Execution validates spans against the retained input and exact requested-category coverage.

Input size uses Unicode code points; evidence offsets use UTF-16 string indices. See the README for exact bounds and evidence rules. The core never silently truncates or normalizes content. No request/result includes policy actions or persistent platform history.

## Verification and stopping point

`npm run check` typechecks, builds, runs frozen contract fixtures and error tests, checks JSON Schema drift and package independence, and executes the public usage example. GitHub Actions repeats this on Node 22 and 24. Fixtures are synthetic contract examples with fixed scores; they establish interface behavior only.

Real classifier evaluation, new media/language capabilities, platform adapters, legacy extraction/parity, and deployments are separate work. This phase ends when the independent foundation builds and passes its checks.
