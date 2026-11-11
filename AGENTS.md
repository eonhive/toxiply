<!--
Company: EonHive Inc. | Title: Toxiply repository instructions
Purpose: Preserve the independent engine and auditable evaluation boundary.
Author: Stan Nesi | Created: 2026-10-31 | Updated: 2026-10-31
Notes: Vibe coded with Codex.
-->
# Toxiply contributor instructions

Read README.md, NEXT_STEPS.md, BUILD_STATUS.md, docs/DECISIONS.md,
docs/EVALUATION.md, docs/PROVENANCE.md, docs/architecture/TOXIPLY_CORE.md and
docs/CONTEXTUAL_ATTRIBUTION.md before planning changes. Follow the user's global
coding/header rules and list intended files before editing.

Toxiply is one independent TypeScript library for stateless content understanding
and structured evidence. Flaggr owns tenant history, SpamMemory, SwarmSense,
SignalRank, PrimeRoute, OpportunityIQ, policies, review, routing, actions and
persistence. Never import Flaggr packages or copy private customer data here.
No database, HTTP server, Python or mandatory network/model provider is required.

T7A additionally permits explicitly configured model inference through the optional
typed client. Keep endpoint configuration out of AnalysisRequest, never follow content
URLs/redirects, and enforce deadlines/response bounds. Keep model responses untrusted:
require exact source quotes/spans, identity and complete declared coverage. Never
invent evidence or harmless fallback scores. Canned adapter replay and loopback mock
servers test integration, not trained model quality. Live inference/accuracy is NOT_RUN
without explicit approved configuration; do not silently use environment credentials.

Preserve the 0.2.0 V1 request/result schema, public exports, five native categories,
source-relative UTF-16 evidence, explicit coverage/status and uncalibrated confidence.
The contextual analyzer remains an opt-in candidate. Changing heuristics, schemas
or promoting an analyzer requires a separate explicit scope and versioned decision.

Evaluation code belongs in eval/ and tests/, not the library's public exports.
Reuse Zod, the existing confusion metrics and Node built-ins. Run focused tests
first, then npm ci, npm run check and npm run eval:all for the final change.
Node 22+ is required; CI also checks Node 24. npm run check already executes all
examples and public diagnostics. Report exact PASS/FAIL/NOT_RUN and coverage limits.

Never change existing labels/rules to improve scores. The native and lexical
diagnostics and attribution challenge are exposed development data with provisional
labels. They cannot become held-out evaluation through renaming or a random split.
Human review requires actual independent review; schema attestations do not prove
identity, rights or independence. Version label corrections and preserve old hashes.

Keep nonpublic datasets, raw reports, credentials and operational material in
ignored .local/ or approved locations outside Git. Imports are immutable and must
not write into another repository or overwrite a dataset version. Do not commit
nonpublic reports or expand npm package contents to include them. Public reports
may summarize only explicitly public inputs with truthful provenance and limits.

Update the decision/evaluation docs plus BUILD_STATUS.md and NEXT_STEPS.md when
behavior or workflows change. A focused PR stops ready for review: do not merge,
publish npm, change visibility/license, deploy, modify Flaggr or touch production.
