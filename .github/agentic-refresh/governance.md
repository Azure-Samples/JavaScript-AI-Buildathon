# Agentic refresh governance

## Safety boundary

Phase 0 creates policy, validation, and authoring support only. It does not
enable scheduled discovery, issue creation, content edits, branch creation, pull
requests, or merge. Any later workflow must read `capabilities.json` and stop in
report-only mode unless Buildathon is explicitly approved for write automation.
The two external sample repositories remain report-only and require manual
maintainer handoff.

## Repository-scoped authentication

Use GitHub Actions' built-in `GITHUB_TOKEN` as defined in
[`github-token.json`](./github-token.json):

- no stored PAT, OAuth token, App ID, or private key;
- token scope is limited to
  `Azure-Samples/JavaScript-AI-Buildathon`;
- Copilot inference uses `copilot-requests: write`;
- discovery/report jobs receive only the permissions they need;
- implementation writes are limited to `refresh/**` through gh-aw safe outputs;
- no cross-repository write, default-branch update, deletion, force-push, or
  merge operation is allowed.

The current local `GH_TOKEN` is an OAuth `gho_` token and must not be stored as a
workflow secret. `GH_AW_GITHUB_TOKEN`, `COPILOT_GITHUB_TOKEN`, and personal PAT
fallbacks are prohibited by this strategy.

## Event-suppression constraint

Events created with `GITHUB_TOKEN` generally do not start new workflow runs.
Before Buildathon writes are enabled, a throwaway spike must prove:

1. issue creation through a safe output;
2. `refresh/**` branch and pull-request creation through a safe output;
3. explicit `workflow_dispatch` of required validation for the current PR head
   SHA after creation and after every automated branch update;
4. explicit Copilot Code Review request for the current head SHA;
5. review/thread events still update `copilot-review-gate`;
6. no write occurs when any explicit dispatch or review request fails.

Failure keeps the system in issue-only or fully report-only mode.

## Repository settings

Apply the disabled templates in [`rulesets/main.json`](./rulesets/main.json) and
[`rulesets/human-merge.json`](./rulesets/human-merge.json) only after both
validation workflows have produced successful check runs. Review the generated
settings before changing `enforcement` to `active`.

Create the labels in [`labels.json`](./labels.json) and configure only the
repository variable `REFRESH_APPROVER_LOGIN`. No credential secret is required.

The main ruleset must require:

- pull requests;
- one CODEOWNER approval;
- approval after the latest push;
- conversation resolution;
- `validate-content`;
- `validate-agentic-workflows`;
- no force-push or branch deletion.

Phase 3 adds `copilot-review-gate` only after that check has been proven on every
pull-request head SHA.

The human-only ruleset contains only an update restriction. Julia is its sole
initial bypass actor and may bypass it only through a pull request. The main
protections are in a separate ruleset with no bypass actors, so the human merge
actor cannot bypass required checks, review, conversation resolution, or
force-push and deletion protections.

## External repository handoff

Discovery may inspect only the allowlisted public source URLs and observed paths
in `quests.json`. It may record an external CodeTour finding in the Buildathon
child issue, but it cannot create an external issue, branch, commit, or pull
request. A human maintainer decides whether and how to transfer the finding.

## SAML authorization

SAML authorization is needed only for local audits and human GitHub operations.
It is not a production workflow dependency. If `gh api` returns HTTP 403:

1. Run `gh auth status` and identify the active token.
2. Open the SSO authorization URL printed by `gh`.
3. Authorize that exact token for the Microsoft Open Source enterprise.
4. Re-run the API request.
5. If an environment `GH_TOKEN` overrides an authorized keyring token, remove
   the override for the audit.

Do not copy that OAuth token into repository secrets.
