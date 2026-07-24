---
name: Discover Microsoft Foundry
description: Manually audits the Microsoft Foundry quest using read-only approved evidence
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
  group: weekly-refresh-${{ inputs.week_key }}-microsoft-foundry
  cancel-in-progress: false
  job-discriminator: ${{ inputs.week_key }}
strict: true
engine:
  id: copilot
  agent: microsoft-foundry-quest-master
network:
  allowed:
    - learn.microsoft.com
imports:
  - shared/discovery-policy.md
  - uses: shared/report-output.md
    with:
      quest-id: 2
      quest-slug: microsoft-foundry
      quest-title: Microsoft Foundry
      quest-label: quest/2-microsoft-foundry
  - ../agents/microsoft-foundry-quest-master.agent.md
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

# Phase 2A Microsoft Foundry Reporting

Run a read-only staged report for quest slug `microsoft-foundry`.

## Execution

1. Read the governance, quest, lifecycle, audience, and report contracts.
2. Confirm the selected quest entry matches the imported Quest Master profile.
3. Invoke `official-source-researcher` once for current official facts and
   lifecycle evidence.
4. Invoke `buildathon-content-auditor` once for current quest drift with exact
   file and section references.
5. Reconcile both reports. Reject unsupported claims and make uncertainty
   explicit.
6. Compare against any exact prior finding keys supplied for
   `${{ inputs.prior_week_key }}`.
7. Call `emit_weekly_report` exactly once with the structured report.
8. Return one concise GitHub-flavored Markdown summary. Do not create or update
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
- Learner impact and proposed changes, clearly labeled as inference/proposal
- Asset and CodeTour impact
- Validation plan
- Risks, uncertainty, source conflicts, and human decisions

## agent: `official-source-researcher`
---
description: Extracts current Microsoft Foundry facts from the exact approved sources
model: small
---
Use only:

- `https://learn.microsoft.com/en-us/azure/foundry/`
- `https://github.com/microsoft/microsoft-foundry-e2e-js`

Do not follow external links. Use web fetch or read-only GitHub retrieval, not
shell commands. Return only compact evidence records containing source fact,
lifecycle, evidence URL, evidence location, observed wording, and source
fingerprint. Use `Not stated by allowed sources` instead of inferring lifecycle.

## agent: `buildathon-content-auditor`
---
description: Finds Microsoft Foundry drift in the exact Buildathon-owned paths
model: small
---
Inspect only:

- `02-E2E-Model-Development-on-Foundry/**`
- `README.md`
- `docs/quests.md`

Use repository reads or the allowed read-only shell commands. Do not use the web,
edit files, or run project code. Return exact file and section references,
repository observations, and candidate learner impact. Do not convert an
observation into a product fact.
