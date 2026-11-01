# Next steps

Updated: 2026-10-31

Phase T3 adds [review-dataset infrastructure](docs/TEXT_EVALUATION_DATASETS.md) and a
[public paired baseline](docs/T3_BASELINE.md), preserving the engine and candidate.
Stop after its focused PR is ready for review; do not merge, publish or promote it.
The next bounded PR should onboard an owner-approved independently reviewed corpus
and separately collected/frozen held-out split, with permission/reviewer records,
versioned category/span guidance and all known development references. Keep nonpublic
inputs/raw reports outside Git. Measure both unchanged analyzers before proposing
one separate heuristic improvement for reporting/criticism/implied-threat/evasion gaps.
No real independent review, held-out result or calibration is claimed by the schema.

1. Review the opt-in contextual attribution candidate and paired diagnostic results. The frozen native analyzer is unchanged. Keep private fixtures/reports ignored and the npm package private/UNLICENSED.
2. Complete independent human label review and obtain a separate realistic held-out corpus. The user chose provisional labels for the candidate PR; observed development gains cannot stand in for that evidence.
3. Evaluate unrecognized reporting, implicit endorsement, product/person ambiguity, nested/long quotations and nonlocal references before any candidate promotion. Version quality changes and report both gains and regressions; never retune labels to match outputs.
4. Treat a future Flaggr adapter/shadow comparison as a separate task after its own explicit scope is agreed. Define mappings for internal severity/subtype/targeting without forcing missing public V1 concepts into legacy shapes. Preserve platform APIs, tenant isolation, idempotency and journals before any cutover.

This quality pass stops at the separately versioned candidate and reproducible provisional diagnostics. No default replacement, Flaggr production integration, deployment, new service or external model is part of this task.
