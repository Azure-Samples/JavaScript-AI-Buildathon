# Agentic refresh controls

This directory contains the governance boundary for quest refresh automation.
Phase 0 established the controls. Phase 1 adds manually dispatched, read-only
discovery workflows without enabling schedules or repository writes.

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
  manual Phase 1 audits. Their shared policy permits only read operations and
  returns reports in the agent response. Every automatic issue path is disabled,
  and safe-output processing is forced into staged preview mode.

Run the local Phase 0 checks with:

```bash
node scripts/validate-refresh-config.mjs
node scripts/validate-content-links.mjs
mkdocs build --strict
gh aw compile --strict --validate
```

No scheduled or write-capable agentic workflow is enabled. Phase 1 workflows
cannot be live-trialed through `workflow_dispatch` until their compiled
definitions are available on the default branch.

gh-aw v0.77.5 normally reserves `issues: write` for generated failure-reporting
jobs even when issue handlers are disabled. Phase 1 additionally sets
`safe-outputs.staged: true`, which removes that write permission from the
compiled locks. Validation checks both the suppression guards and the absence of
repository write permissions.
