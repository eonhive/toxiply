# Independent Toxiply core

Updated: 2026-10-30 · Status: Phase 2 implementation specification
Updated: 2026-10-30 · Status: Phase 1 foundation plus opt-in Phase 2 native extraction

This document describes the standalone `@eonhive/toxiply` package. It supersedes older local reference material that placed platform history and routing inside Toxiply. The reusable core accepts current text and bounded semantic context. Applications own persistent identity/history, tenant policy, workflow, and actions.

## Package boundary

One TypeScript library executes in the caller's process. It has no platform imports, storage, service endpoints, required network access, or mandatory inference provider. Zod is the only runtime dependency. Phase 2 adds one opt-in literal English profanity analyzer; it is a deterministic lexical algorithm, not a trained model. There is no claim of legacy behavior parity.
One TypeScript library executes in the caller's process. It has no platform imports, storage, service endpoints, required network access, or mandatory inference provider. Zod is the only runtime dependency. Phase 1 shipped no classifier; Phase 2 adds the optional frozen native heuristic implementation described below. It does not replace Flaggr's runtime.

```text
unknown request
  -> strict versioned request validation
  -> select declared category/language/context capabilities
  -> optional local text analyzer
  -> validate category completeness and source-relative evidence
  -> versioned result with coverage, provenance, and missing capabilities
```

The public API is `analyze()` for the unconfigured core and `createAnalyzer()` for one `TextAnalyzer`. `createEnglishProfanityAnalyzer()` supplies the optional built-in implementation. No plugin registry, multi-provider orchestration, networking layer, or persistent state is needed. An adapter is trusted local code, not a security sandbox; hosts own its execution limits.

## First native analyzer

`src/text/english-profanity.ts` owns a small, independently authored vocabulary, Unicode-aware token boundaries, ASCII case matching, and a binary presence signal. The result contains one witness span for the first matching token. It never counts matches, interprets quotes/intent, normalizes evasions, or analyzes semantic context. Its descriptor advertises only `profanity`, exact `en`, and `supportsContext: false`; `literal-en-v1` versions vocabulary, matching, scoring, and evidence selection together. Capability declarations are frozen to prevent accidental changes.

The default core stays unconfigured. Adding this implementation changes no V1 request/result schema or orchestration behavior. See [the capability specification](../ENGLISH_PROFANITY.md) for exact matching semantics and limitations.

## Native content implementation

`nativeTextAnalyzer` implements the existing optional interface over `src/native/` text, conversation, language preparation and fusion. All types are local content-only shapes. Five category scores map to the V1 findings; unsupported profanity/spam/language requests retain explicit missing coverage. The default engine is not enabled automatically.

The native composition preserves the legacy content assessment for compatibility measurement. Its additional escalation/subtype/severity/heuristic-confidence details remain internal, with no new platform data in the result contract. The adapter reports composite version provenance; individual frozen lane versions and source hashes are recorded in [PROVENANCE.md](../PROVENANCE.md).

Optional `context.replyTarget` supplies one of four bounded semantic targets. It participates in context support/stripping like parent/quoted text. Evidence uses original full-field UTF-16 spans because these heuristics do not produce precise token localization. Working-copy normalization never changes the request or source-relative spans.

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

`npm run check` typechecks, builds, runs contract/error/analyzer/evaluation tests, checks JSON Schema drift and package independence, executes both public usage examples, and runs the text diagnostic. GitHub Actions repeats this on Node 22 and 24. Original Phase 1 fixtures are synthetic contract examples with fixed scores; they establish interface behavior only.

The Phase 2 diagnostic records real lexical outputs against a separate synthetic 36-case dataset with provisional labels. It records dataset/analyzer provenance and reports known misses. Human review of those labels remains pending, and it is not a production quality gate. See [the evaluation method](../EVALUATION.md).

This phase ends when the opt-in analyzer, diagnostic runner, docs, and existing foundation pass their checks. Semantic classifiers, new media/language capabilities, platform adapters, legacy extraction/parity, and deployments are separate work.
The native regression suite additionally covers fixed harm-category scores, unchanged criticism errors, context targeting, source evidence spans, unsupported categories/languages, independent calls and default opt-in behavior. The private 40-case parity run has zero content differences and unchanged provisional-label errors. Independent realistic held-out evaluation, quality improvements, media/language expansion, Flaggr compatibility/shadow adapters and deployments remain separate work.
