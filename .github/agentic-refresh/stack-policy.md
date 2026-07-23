# Stack and branch policy

All automation branches must match the `branchPattern` in `quests.json`. A stack
is a same-repository pull-request chain; related stacks in different
repositories are linked through the approved child issue.

Buildathon stack:

```text
main
└── 01-core
    └── 02-docs
```

External sample stack:

```text
main
└── 01-sample
    └── 02-codetour
```

- Each pull request targets the branch immediately below it.
- Skip an optional layer when it has no logical change; never create an empty
  layer.
- Keep pull requests draft while an agent is editing.
- Allow one open implementation stack per quest and repository.
- Allow at most two active quest implementations across all repositories.
- Never expose the GitHub App token to an agent or generic shell step. Only the
  pinned deterministic safe-output action may update `refresh/**` branches or
  create pull requests, and it must not implement a merge operation.
- Keep intermediate stack layers unmerged until Julia performs the approved
  human stack merge.
- Never push to or merge `main`.
- Only a human may merge the highest approved layer.
- Workflow, agent, skill, governance, CODEOWNER, and validation-script files are
  outside content-refresh ownership.
