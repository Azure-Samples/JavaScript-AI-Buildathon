---
name: Discover Foundry Local
description: Manually audits the Foundry Local quest using read-only approved evidence
on:
  workflow_dispatch:
permissions:
  contents: read
  copilot-requests: write
strict: true
engine:
  id: copilot
  agent: foundry-local-quest-master
network:
  allowed:
    - www.foundrylocal.ai
imports:
  - shared/discovery-policy.md
  - ../agents/foundry-local-quest-master.agent.md
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

# Phase 1 Foundry Local Discovery

Run a read-only manual trial for quest slug `foundry-local`.

## Execution

1. Read the governance, quest, lifecycle, audience, and report contracts.
2. Confirm the selected quest entry matches the imported Quest Master profile.
3. Invoke `official-source-researcher` once for current official facts and
   lifecycle evidence.
4. Invoke `buildathon-content-auditor` once for current quest drift with exact
   file and section references.
5. Reconcile both reports. Reject unsupported claims and make uncertainty
   explicit.
6. Return one concise GitHub-flavored Markdown report. Do not create or update
   any persistent resource.

## Final report contract

Start nested headings at `###` and include:

- `Result: material-change | no-material-change | blocked`
- Trial key `phase1-${{ github.run_id }}` and quest identity
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
description: Extracts current Foundry Local facts from the exact approved sources
model: small
---
Use only:

- `https://www.foundrylocal.ai/`
- `https://github.com/microsoft/foundry-local`

Do not follow external links. Use web fetch or read-only GitHub retrieval, not
shell commands. Return only compact evidence records containing source fact,
lifecycle, evidence URL, evidence location, observed wording, and source
fingerprint. Use `Not stated by allowed sources` instead of inferring lifecycle.

## agent: `buildathon-content-auditor`
---
description: Finds Foundry Local drift in the exact Buildathon-owned paths
model: small
---
Inspect only:

- `01-Local-AI-Development/**`
- `README.md`
- `docs/quests.md`

Use repository reads or the allowed read-only shell commands. Do not use the web,
edit files, or run project code. Return exact file and section references,
repository observations, and candidate learner impact. Do not convert an
observation into a product fact.
