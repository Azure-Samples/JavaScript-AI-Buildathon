---
name: Discover Agentic RAG
description: Manually audits the Agentic RAG quest and report-only CodeTours using approved evidence
on:
  workflow_dispatch:
permissions:
  contents: read
  copilot-requests: write
strict: true
engine:
  id: copilot
  agent: agentic-rag-quest-master
network:
  allowed:
    - docs.langchain.com
imports:
  - shared/discovery-policy.md
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

# Phase 1 Agentic RAG Discovery

Run a read-only manual trial for quest slug `agentic-rag`.

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
7. Return one concise GitHub-flavored Markdown report. Do not create or update
   any persistent resource.

## Final report contract

Start nested headings at `###` and include:

- `Result: material-change | no-material-change | blocked`
- Trial key `phase1-${{ github.run_id }}` and quest identity
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
