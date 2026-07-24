# Weekly report contract

Each weekly run produces one digest covering all five quests. It creates a child
plan only for a material change.

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
