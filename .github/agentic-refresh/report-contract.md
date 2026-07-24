# Weekly report contract

Each weekly run produces one digest covering all five quests. It creates a child
plan only for a material change.

Every quest run first emits one version 1 JSON artifact with:

- ISO week key, prior ISO week key, and exact quest slug;
- exactly one result: `material-change`, `no-material-change`, or `blocked`;
- source facts separated from repository observations and proposed changes;
- lifecycle, allowlisted evidence URL, evidence location, wording, and source
  fingerprint for every official-source delta;
- learner impact, owned-path drift, asset impact, report-only CodeTour impact,
  validation, risks, human decisions, and prior finding keys;
- deterministic parent key, child key, markers, source fingerprints, and finding
  keys added by `scripts/weekly-refresh-report.mjs`.

A completed report must include source fingerprints. A blocked report must state
one concise reason and cannot propose changes. A no-change report cannot propose
changes. Invalid or missing quest artifacts become blocked scopes in the digest.
Source and path validation rejects adjacent URL-prefix matches, absolute paths,
backslashes, normalization changes, and traversal segments before materializing
an artifact.

A child plan must contain:

1. Quest and ISO week key.
2. Executive summary.
3. Current quest status.
4. Official-source delta table, including lifecycle.
5. Evidence URLs and source fingerprints.
6. Learner impact: `high`, `medium`, or `low`.
7. Current-content drift with file and section references.
8. Proposed changes grouped by repository and owned path.
9. Asset and CodeTour impact.
10. Stack map and deterministic branch names.
11. Validation plan.
12. Risks, uncertainty, and human decisions.
13. The exact approval instruction `/approve-refresh`.

Reports must distinguish source facts, repository observations, inferred
impact, proposed changes, and unresolved uncertainty. Search snippets are not
evidence. No implementation may start from a digest or an unapproved child
plan.

Phase 2A produces only run-scoped artifacts:

- one validated JSON artifact per successful quest output;
- one deterministic digest JSON file;
- one parent issue Markdown preview;
- one child issue Markdown preview only for each material-change result.

No Phase 2A workflow creates or updates an issue, comment, branch, pull request,
workflow dispatch, schedule, or content file.
