# Agentic refresh governance

## Safety boundary

Phase 0 creates policy, validation, and authoring support only. It does not
enable scheduled discovery, issue creation, content edits, branch creation, pull
requests, or merge. Any later workflow must read `capabilities.json` and stop in
report-only mode unless the target repository is explicitly approved for write
automation.

## GitHub App

Create a dedicated GitHub App from [`github-app.json`](./github-app.json):

1. Select **Only on this account** for installation.
2. Grant only the listed repository permissions.
3. Install it only on repositories whose capability matrix is approved.
4. Store the App ID as `AGENTIC_REFRESH_APP_ID`.
5. Store the private key as `AGENTIC_REFRESH_APP_PRIVATE_KEY`.
6. Never grant administration, deployment, environment, release, organization,
   ruleset-bypass, or merge authority.

Tokens must be installation tokens scoped to one target repository and must
expire within one hour. Workflows may create only `refresh/**` branches. The
agent process must never receive an App token. A pinned deterministic safe-output
action mints and consumes the token only after validating the target repository,
branch, paths, operation count, and patch size. That action exposes no merge,
default-branch update, deletion, or force-push operation.

## Repository settings

Apply the disabled templates in [`rulesets/main.json`](./rulesets/main.json) and
[`rulesets/human-merge.json`](./rulesets/human-merge.json) only after both
validation workflows have produced successful check runs. Review the generated
settings before changing `enforcement` to `active`.

Create the labels in [`labels.json`](./labels.json). Configure:

- variable `REFRESH_APPROVER_LOGIN`;
- variable `AGENTIC_REFRESH_APP_ID`;
- secret `AGENTIC_REFRESH_APP_PRIVATE_KEY`.

The main ruleset must require:

- pull requests;
- one CODEOWNER approval;
- approval after the latest push;
- conversation resolution;
- `validate-content`;
- `validate-agentic-workflows`;
- no force-push or branch deletion.

The App must not be a bypass actor. Phase 3 adds `copilot-review-gate` only after
that check has been proven on every pull-request head SHA.

The human-only ruleset contains only an update restriction. Julia is its sole
initial bypass actor and may bypass it only through a pull request. The main
protections are in a separate ruleset with no bypass actors, so the human merge
actor cannot bypass required checks, review, conversation resolution, or
force-push and deletion protections.

The platform update restriction protects the final `main` update. The App must
update `refresh/**` branches to build a stack, so intermediate stack bases cannot
use that restriction. Their no-merge boundary is enforced by token isolation:
only the pinned safe-output action receives the App token, and merge is not an
available output. Changes to that action, workflow policy, or permissions require
the protected automation review path.

## SAML authorization

If `gh api repos/Azure-Samples/JavaScript-AI-Buildathon` returns HTTP 403:

1. Run `gh auth status` and identify the active token.
2. Open the SSO authorization URL printed by `gh`.
3. Authorize that exact token for the Microsoft Open Source enterprise.
4. Re-run the API request.
5. If an environment `GH_TOKEN` overrides an authorized keyring token, remove
   the override for the audit or authorize the overriding token.

Do not replace this control with a broader personal access token.
