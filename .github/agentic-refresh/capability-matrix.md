# Refresh capability matrix

The machine-readable source of truth is
[`capabilities.json`](./capabilities.json). A repository is **report-only**
unless every required capability is confirmed, an administrator records
approval evidence, and `writeAutomationAllowed` is explicitly set to `true`.

| Repository | Current mode | Capability status | Administrator approval |
|---|---|---|---|
| `Azure-Samples/JavaScript-AI-Buildathon` | Report-only | Blocked | Missing |
| `Azure-Samples/serverless-chat-langchainjs` | Report-only | Blocked | Missing |
| `Azure-Samples/mcp-agent-langchainjs` | Report-only | Blocked | Missing |

## Required confirmation

For each repository, an administrator must confirm:

1. The dedicated GitHub App is installed for that repository.
2. Copilot Code Review is enabled and an AI-credit budget is available.
3. `refresh/**` branches may be created by the App.
4. The main-branch ruleset requires pull requests, CODEOWNER approval,
   conversation resolution, and the repository's known CI checks.
5. The App cannot bypass the ruleset, push to `main`, force-push, delete a
   protected branch, or merge.
6. `REFRESH_APPROVER_LOGIN` is set to the exact approved GitHub login.
7. `AGENTIC_REFRESH_APP_ID` and `AGENTIC_REFRESH_APP_PRIVATE_KEY` are configured
   without exposing their values in issues, logs, or repository files.

Record the approver login, UTC timestamp, and a settings or approval reference
in `capabilities.json`. Do not replace an unknown capability with an assumption.

## Audit findings

The SSO-authorized keyring token completed a read-only audit on July 23, 2026.

- Buildathon: Julia has repository administration; Copilot Code Review is
  active; refresh labels and `REFRESH_APPROVER_LOGIN` are configured. Active
  branch protection requires one approval and conversation resolution. Disabled
  ruleset `19622585` is prepared to require the Phase 0 checks, one CODEOWNER
  approval, approval after the latest push, conversation resolution, and to
  block deletion and force-push after this Phase 0 change lands. A separate
  update-restriction template permits only Julia, through a pull request, to
  update `main`; the App is not a bypass actor. GitHub returned HTTP 404 when
  that user-bypass ruleset was created through the REST API, so an administrator
  must confirm or create it in repository settings. The App, AI-credit budget
  confirmation, ruleset activation, and explicit App permission for
  `refresh/**` branches are missing.
- Serverless Chat: Julia has write but not administration; two active rulesets
  and Copilot Code Review are visible. An administrator must confirm the
  rulesets, budget, App installation, and `refresh/**` branch policy.
- MCP Agent: Julia has write but not administration; Copilot Code Review is
  visible, but no qualifying ruleset or classic main-branch protection was
  visible. An administrator must establish the complete governance boundary.

Julia cannot access the Azure-Samples organization settings needed to create an
organization-owned App. An organization owner must complete that action.

## Organization-owner handoff

Ask an Azure-Samples owner to:

1. Create an organization-owned **Azure Samples Agentic Refresh** GitHub App
   with the repository permissions in `github-app.json` and no organization
   permissions.
2. Disable webhooks and restrict installation to the Azure-Samples account.
3. Install it only on `Azure-Samples/JavaScript-AI-Buildathon`.
4. Provide the App ID through repository variable
   `AGENTIC_REFRESH_APP_ID`.
5. Store the generated PEM private key directly in repository secret
   `AGENTIC_REFRESH_APP_PRIVATE_KEY`; never send it through chat or an issue.
6. Confirm that Copilot Code Review has an available AI-credit budget.
7. Confirm that the App may create `refresh/**` branches but cannot bypass
   ruleset `19622585`, write to `main`, or merge.
8. After the Phase 0 pull request merges and both validation checks have run
   successfully, activate ruleset `19622585` and the human-only merge ruleset.
9. Confirm that App installation tokens are available only to the pinned
   deterministic safe-output action and never to an agent or generic shell step.

The external repositories stay report-only. Their App installation requires a
separate capability approval after a repository administrator confirms each
ruleset, CI, CODEOWNER, branch, and budget requirement.
