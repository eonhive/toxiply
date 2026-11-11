# Next steps

Updated: 2026-11-11

Phase T6A adds the optional [English spam/scam surface analyzer](docs/ENGLISH_SPAM_SCAM.md)
and a separately versioned synthetic diagnostic. It is ready for focused review after
required verification; no production validation or automatic enforcement is claimed.
The frozen native/contextual/lexical analyzers, V1 contracts and default unconfigured
behavior remain unchanged. Independent human validation continues separately and did
not block this bounded local feature. Stop at one reviewable PR; no merge or release.

1. Review T6A's finite cue combinations, source evidence, English-only language declaration
   and explicit lack of semantic context. Inspect the 48-case public provisional report:
   15 TP / 23 TN / 5 FP / 5 FN. Quotes, warnings and satire cause false positives; unlisted
   wording, obfuscation and missing companion cues cause false negatives. A zero signal
   does not establish safety. Keep the factory optional.
2. Proposed T6B: obtain approved independent contrast annotations for solicitations versus
   legitimate support/payments, quoted warnings, negated advice and satire. Scope one
   separately versioned attribution experiment; preserve T6A as a baseline and report
   gains/regressions with evidence. Do not broaden into URL safety, reputation or history.
   This is a proposal, not implemented or authorized production behavior.
3. Continue [T5 onboarding](docs/T5_VALIDATION_READINESS.md) using existing T3/T4 tools.
   Actual corpus permission, reviewer identity/independence, annotation, freeze and
   separately collected held-out records remain missing; independent/held-out validation
   and calibration are NOT_RUN. Include all exposed development references, including
   this new spam/scam dataset, in leakage audits and explicit review CLI references.
   Keep nonpublic inputs/reports ignored or outside Git; do not manufacture review records
   or relabel synthetic data as held-out. No additional workflow tooling is required.
4. The earlier proposed unquoted victim-report attribution experiment remains separate
   and unimplemented. Keep native frozen and contextual opt-in; do not silently combine
   that experiment with T6A or retune old labels/rules.
5. Any future Flaggr adapter/shadow comparison needs separate explicit scope, tested
   legacy mappings and platform safeguards. SpamMemory, SwarmSense, SignalRank,
   PrimeRoute, OpportunityIQ, tenant policy, review, actions and persistence remain
   Flaggr-owned. No Flaggr source, production integration or automatic action changes here.

[T3 baseline](docs/T3_BASELINE.md), [T4 annotation workflow](docs/TEXT_ANNOTATION_REVIEW.md)
and [T5 readiness](docs/T5_VALIDATION_READINESS.md) remain historical records. No analyzer
promotion, model/network provider, additional infrastructure, deployment, npm publication,
license/visibility change or automatic merge is part of this work.
