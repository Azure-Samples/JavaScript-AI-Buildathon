# Agentic refresh controls

This directory contains the Phase 0 governance boundary for future quest refresh
automation.

- [`capabilities.json`](./capabilities.json) keeps every repository report-only
  until an administrator confirms all write prerequisites.
- [`quests.json`](./quests.json) defines source allowlists, repository ownership,
  approval identity, branch shape, and operational limits.
- [`governance.md`](./governance.md) documents the GitHub App and repository
  settings that require administrator action.
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
