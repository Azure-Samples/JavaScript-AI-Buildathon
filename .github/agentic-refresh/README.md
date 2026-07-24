# Agentic refresh controls

This directory contains the governance boundary for quest refresh automation.
Phase 0 established the controls. Phase 1 added manually dispatched, read-only
discovery workflows. Phase 2A adds reusable staged reporting, structured
artifacts, and deterministic parent/child previews without enabling schedules or
repository writes.

- [`capabilities.json`](./capabilities.json) keeps Buildathon writes disabled
  until the repository-scoped token and dispatch spikes pass. External
  repositories are permanently report-only under this strategy.
- [`quests.json`](./quests.json) defines source allowlists, Buildathon ownership,
  external observation paths, approval identity, branch shape, and operational
  limits.
- [`github-token.json`](./github-token.json) defines the built-in
  `GITHUB_TOKEN` permission and event model without storing a PAT or App key.
- [`governance.md`](./governance.md) documents the repository settings and
  technical spikes required before enabling Buildathon write automation.
- [`lifecycle-policy.md`](./lifecycle-policy.md),
  [`audience-style-guide.md`](./audience-style-guide.md),
  [`report-contract.md`](./report-contract.md),
  [`stack-policy.md`](./stack-policy.md), and
  [`asset-policy.md`](./asset-policy.md) define the non-negotiable content and
  workflow contracts.
- The five Quest Master profiles under [`../agents`](../agents) fix each quest's
  source and path boundary.
- The five `discover-*.md` workflows under [`../workflows`](../workflows) run
  manual or orchestrated audits. Their shared policy permits only read
  operations, and `shared/report-output.md` materializes a validated run-scoped
  JSON artifact. Every automatic issue path is disabled, and safe-output
  processing is forced into staged preview mode.
- `weekly-refresh-orchestrator.yml` fans out to all five reusable compiled
  workflows only through manual dispatch. `weekly-refresh-digest.md` downloads
  available quest artifacts, converts missing scopes to blocked results, and
  uploads deterministic parent and child issue previews.
- `scripts/weekly-refresh-report.mjs` is the machine-readable authority for ISO
  week context, schema validation, lifecycle/source/path boundaries, materiality,
  markers, finding keys, deduplication keys, and preview rendering.

Run the local Phase 0 checks with:

```bash
node scripts/validate-refresh-config.mjs
node scripts/weekly-refresh-report.mjs self-test
node scripts/validate-content-links.mjs
mkdocs build --strict
gh aw compile --strict --validate
```

No scheduled or write-capable agentic workflow is enabled. The discovery and
reporting workflows cannot be live-trialed through `workflow_dispatch` until
their compiled definitions are available on the default branch.

gh-aw v0.77.5 normally reserves `issues: write` for generated failure-reporting
jobs even when issue handlers are disabled. Phase 1 additionally sets
`safe-outputs.staged: true`, which removes that write permission from the
compiled locks. Validation checks both the suppression guards and the absence of
repository write permissions.
