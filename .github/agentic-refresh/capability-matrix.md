# Refresh capability matrix

The machine-readable source of truth is
[`capabilities.json`](./capabilities.json).

- Buildathon stays **report-only** until every same-repository write and dispatch
  capability is confirmed, approval evidence is recorded, and
  `writeAutomationAllowed` is explicitly set to `true`.
- The two external sample repositories are intentionally **report-only** and do
  not have an automated write-enablement path under this strategy.

| Repository | Role | Current mode | Capability status |
|---|---|---|---|
| `Azure-Samples/JavaScript-AI-Buildathon` | Automation host | Report-only | Blocked |
| `Azure-Samples/serverless-chat-langchainjs` | External evidence | Report-only | Policy |
| `Azure-Samples/mcp-agent-langchainjs` | External evidence | Report-only | Policy |

## Buildathon confirmation

Before Buildathon write automation is enabled, confirm:

1. Copilot inference works with `copilot-requests: write` and the organization
   has an available AI-credit budget.
2. `GITHUB_TOKEN` can create a Buildathon issue through a bounded safe output.
3. `GITHUB_TOKEN` can create and update only `refresh/**` branches and open a
   Buildathon pull request through bounded safe outputs.
4. Explicit workflow dispatch produces every required check for the current head
   SHA after token-created PRs and subsequent automated updates.
5. Copilot Code Review can be explicitly requested for the current head SHA.
6. The main ruleset requires pull requests, CODEOWNER approval, conversation
   resolution, and the known required checks.
7. The workflow cannot push to `main`, merge, force-push, delete branches, or
   write to another repository.
8. `REFRESH_APPROVER_LOGIN` is set to the exact approved GitHub login.

Record the approver login, UTC timestamp, and trial evidence in
`capabilities.json`. Do not replace an unknown capability with an assumption.

## Audit findings

The SSO-authorized keyring token completed a read-only audit on July 23, 2026.

- Buildathon: Copilot Code Review is active; refresh labels and
  `REFRESH_APPROVER_LOGIN` are configured. Active branch protection requires one
  approval and conversation resolution. Disabled ruleset `19622585` is prepared
  to require the Phase 0 checks, CODEOWNER approval, approval after the latest
  push, conversation resolution, and to block deletion and force-push. A
  separate human-only update template still requires administrator confirmation
  because the user-bypass REST request returned HTTP 404.
- Serverless Chat and MCP Agent remain external evidence sources only. No
  workflow in Buildathon may write to them.

The unavailable organization-owned GitHub App is no longer a blocker or planned
dependency. Built-in-token event suppression and repository write permissions
are the new technical gates.

## Activation sequence

1. Merge the Phase 0 pull request.
2. Confirm or create the human-only merge ruleset in repository settings.
3. Activate ruleset `19622585` and the human-only merge ruleset.
4. Run read-only discovery trials.
5. Run the bounded `GITHUB_TOKEN` issue, branch, PR, explicit-dispatch, and
   Copilot-review spike.
6. Enable issue-only reporting if issue writes pass.
7. Enable Buildathon implementation only after every write/review gate passes.

External CodeTour findings remain manual handoffs regardless of Buildathon
capability results.
