---
name: Discover Context Engineering
description: Manually audits the Context Engineering quest and report-only CodeTours using approved evidence
on:
  workflow_call:
    inputs:
      week_key:
        description: ISO week key for this reporting run
        required: true
        type: string
      prior_week_key:
        description: ISO week key used to locate prior findings
        required: true
        type: string
  workflow_dispatch:
    inputs:
      week_key:
        description: ISO week key for this reporting run
        required: true
        type: string
      prior_week_key:
        description: ISO week key used to locate prior findings
        required: true
        type: string
permissions:
  contents: read
  copilot-requests: write
concurrency:
  group: weekly-refresh-${{ inputs.week_key }}-context-engineering
  cancel-in-progress: false
  job-discriminator: ${{ inputs.week_key }}
strict: true
engine:
  id: copilot
  agent: context-engineering-quest-master
network:
  allowed:
    - docs.langchain.com
    - modelcontextprotocol.io
imports:
  - shared/discovery-policy.md
  - uses: shared/report-output.md
    with:
      quest-id: 5
      quest-slug: context-engineering
      quest-title: Context Engineering in Agents
      quest-label: quest/5-context-engineering
  - ../agents/context-engineering-quest-master.agent.md
safe-outputs:
  activation-comments: false
  missing-data: false
  missing-tool: false
  noop: false
  report-failure-as-issue: false
  report-incomplete: false
  staged: true
  threat-detection: false
timeout-minutes: 20
---

# Phase 2A Context Engineering Reporting

Run a read-only staged report for quest slug `context-engineering`.

## Execution

1. Read the governance, quest, lifecycle, audience, and report contracts.
2. Confirm the selected quest entry matches the imported Quest Master profile.
3. Invoke `official-source-researcher` once for current MCP, LangChain, and
   lifecycle evidence.
4. Invoke `buildathon-content-auditor` once for current quest drift with exact
   file and section references.
5. Invoke `external-codetour-auditor` once for the six report-only CodeTours.
6. Reconcile all reports. Reject unsupported claims and make uncertainty
   explicit.
7. Compare against any exact prior finding keys supplied for
   `${{ inputs.prior_week_key }}`.
8. Call `emit_weekly_report` exactly once with the structured report.
9. Return one concise GitHub-flavored Markdown summary. Do not create or update
   repository content or GitHub issues, comments, branches, or pull requests.

## Final report contract

Start nested headings at `###` and include:

- `Result: material-change | no-material-change | blocked`
- Week key `${{ inputs.week_key }}`, prior week `${{ inputs.prior_week_key }}`,
  and quest identity
- Executive summary and current quest status
- Official-source facts and deltas with lifecycle, URL, location, observed
  wording, and fingerprint
- Buildathon drift with file and section references
- External CodeTour observations marked `report-only` and `manual-maintainer`
- Learner impact and proposed changes, clearly labeled as inference/proposal
- Asset impact, validation plan, risks, uncertainty, conflicts, and decisions

## agent: `official-source-researcher`
---
description: Extracts current MCP and LangChain facts from the exact approved sources
model: small
---
Use only:

- `https://modelcontextprotocol.io/docs/getting-started/intro`
- `https://docs.langchain.com/oss/javascript/langchain/mcp`
- `https://github.com/microsoft/mcp-for-beginners`
- `https://github.com/Azure-Samples/mcp-agent-langchainjs`

Do not follow external links. Use web fetch or read-only GitHub retrieval, not
shell commands. Return compact evidence records containing source fact,
lifecycle, evidence URL, evidence location, observed wording, and source
fingerprint. Use `Not stated by allowed sources` instead of inferring lifecycle.

## agent: `buildathon-content-auditor`
---
description: Finds Context Engineering drift in the exact Buildathon-owned paths
model: small
---
Inspect only:

- `05-Run-Burger-Ordering-Agent-System/**`
- `README.md`
- `docs/quests.md`

Use repository reads or the allowed read-only shell commands. Do not use the web,
edit files, or run project code. Return exact file and section references,
repository observations, and candidate learner impact. Preserve the burger
ordering scenario.

## agent: `external-codetour-auditor`
---
description: Audits the six exact mcp-agent-langchainjs CodeTours as report-only evidence
model: small
---
Read only repository `Azure-Samples/mcp-agent-langchainjs` and these paths:

- `.tours/1-introduction.tour`
- `.tours/2-designing-agents.tour`
- `.tours/3-building-mcp-tools.tour`
- `.tours/4-building-agent-api.tour`
- `.tours/5-backend-api-design.tour`
- `.tours/6-infrastructure-deployment.tour`

Use read-only GitHub retrieval only. Return repository SHA, path, tour step,
observation, and suggested manual validation. Mark every finding `report-only`
and `manual-maintainer`. Do not create or request an external write.
