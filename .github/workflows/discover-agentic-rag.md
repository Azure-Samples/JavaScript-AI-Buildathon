---
name: Discover Agentic RAG
description: Manually audits the Agentic RAG quest and report-only CodeTours using approved evidence
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
  group: weekly-refresh-${{ inputs.week_key }}-agentic-rag
  cancel-in-progress: false
  job-discriminator: ${{ inputs.week_key }}
strict: true
engine:
  id: copilot
  agent: agentic-rag-quest-master
network:
  allowed:
    - docs.langchain.com
imports:
  - shared/discovery-policy.md
  - uses: shared/report-output.md
    with:
      quest-id: 3
      quest-slug: agentic-rag
      quest-title: LangChain.js Agentic RAG
      quest-label: quest/3-agentic-rag
  - ../agents/agentic-rag-quest-master.agent.md
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

# Phase 2A Agentic RAG Reporting

Run a read-only staged report for quest slug `agentic-rag`.

## Execution

1. Read the governance, quest, lifecycle, audience, and report contracts.
2. Confirm the selected quest entry matches the imported Quest Master profile.
3. Invoke `official-source-researcher` once for current official facts, the
   Agentic RAG pattern, and lifecycle evidence.
4. Invoke `buildathon-content-auditor` once for current quest drift with exact
   file and section references.
5. Invoke `external-codetour-auditor` once for the six report-only CodeTours.
6. Reconcile all reports. Reject unsupported Agentic RAG classifications and
   make uncertainty explicit.
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
description: Extracts current Agentic RAG facts from the exact approved sources
model: small
---
Use only:

- `https://github.com/Azure-Samples/serverless-chat-langchainjs`
- `https://github.com/microsoft/langchainjs-for-beginners`
- `https://docs.langchain.com/oss/javascript/langgraph/agentic-rag`
- `https://docs.langchain.com/`

Do not follow external links. Use web fetch or read-only GitHub retrieval, not
shell commands. Establish the documented Agentic RAG control-flow requirements.
Return compact evidence records containing source fact, lifecycle, evidence URL,
evidence location, observed wording, and source fingerprint.

## agent: `buildathon-content-auditor`
---
description: Finds Agentic RAG drift in the exact Buildathon-owned paths
model: small
---
Inspect only:

- `03-Run-Serverless-RAG-Support-System/**`
- `README.md`
- `docs/quests.md`

Use repository reads or the allowed read-only shell commands. Do not use the web,
edit files, or run project code. Return exact file and section references,
repository observations, and candidate learner impact. Identify whether the
documented sample contains evidence of the official Agentic RAG control flow.

## agent: `external-codetour-auditor`
---
description: Audits the six exact serverless-chat-langchainjs CodeTours as report-only evidence
model: small
---
Read only repository `Azure-Samples/serverless-chat-langchainjs` and these paths:

- `.tours/1-rag-overview.tour`
- `.tours/2-document-ingestion.tour`
- `.tours/3-vector-storage.tour`
- `.tours/4-query-retrieval.tour`
- `.tours/5-response-generation.tour`
- `.tours/6-streaming-chat-history.tour`

Use read-only GitHub retrieval only. Return repository SHA, path, tour step,
observation, and suggested manual validation. Mark every finding `report-only`
and `manual-maintainer`. Do not create or request an external write.
