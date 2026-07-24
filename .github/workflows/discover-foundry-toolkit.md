---
name: Discover Foundry Toolkit
description: Manually audits the Microsoft Foundry Toolkit quest using read-only approved evidence
on:
  workflow_dispatch:
permissions:
  contents: read
  copilot-requests: write
strict: true
engine:
  id: copilot
  agent: foundry-toolkit-quest-master
network:
  allowed:
    - code.visualstudio.com
    - marketplace.visualstudio.com
imports:
  - shared/discovery-policy.md
  - ../agents/foundry-toolkit-quest-master.agent.md
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

# Phase 1 Foundry Toolkit Discovery

Run a read-only manual trial for quest slug `foundry-toolkit`.

## Execution

1. Read the governance, quest, lifecycle, audience, and report contracts.
2. Confirm the selected quest entry matches the imported Quest Master profile.
3. Invoke `official-source-researcher` once for current official facts and
   lifecycle evidence.
4. Invoke `buildathon-content-auditor` once for current quest and asset drift
   with exact file and section references.
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
- Asset and screenshot impact
- Learner impact and proposed changes, clearly labeled as inference/proposal
- Validation plan
- Risks, uncertainty, source conflicts, and human decisions

## agent: `official-source-researcher`
---
description: Extracts current Foundry Toolkit facts from the exact approved sources
model: small
---
Use only:

- `https://github.com/microsoft/azure-skills/blob/main/skills/microsoft-foundry/SKILL.md`
- `https://github.com/microsoft/foundry-toolkit`
- `https://code.visualstudio.com/docs/intelligentapps/overview`
- `https://marketplace.visualstudio.com/items/ms-windows-ai-studio.windows-ai-studio/changelog`

Do not follow external links. Use web fetch or read-only GitHub retrieval, not
shell commands. Return only compact evidence records containing source fact,
lifecycle, evidence URL, evidence location, observed wording, and source
fingerprint. Use `Not stated by allowed sources` instead of inferring lifecycle.

## agent: `buildathon-content-auditor`
---
description: Finds Foundry Toolkit drift in the exact Buildathon-owned paths
model: small
---
Inspect only:

- `04-Build-Agents-with-AIToolKit/**`
- `README.md`
- `docs/quests.md`

Use repository reads or the allowed read-only shell commands. Do not use the web,
edit files, run project code, or propose a directory rename. Return exact file,
section, asset, screenshot, and alt-text references with repository observations
and candidate learner impact.
