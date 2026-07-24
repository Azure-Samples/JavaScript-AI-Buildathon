# Agentic refresh controls

This directory contains the Phase 0 governance boundary for future quest refresh
automation.

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

Run the local Phase 0 checks with:

```bash
node scripts/validate-refresh-config.mjs
node scripts/validate-content-links.mjs
mkdocs build --strict
gh aw compile --strict --validate
```

No scheduled or write-capable agentic workflow is enabled in Phase 0.
