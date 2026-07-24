# Stack and branch policy

All automation branches must match the `branchPattern` in `quests.json`. The
automation creates stacks only inside
`Azure-Samples/JavaScript-AI-Buildathon`.

Buildathon stack:

```text
main
└── 01-core
    └── 02-docs
```

- Each pull request targets the branch immediately below it.
- Skip an optional layer when it has no logical change; never create an empty
  layer.
- Keep pull requests draft while an agent is editing.
- Allow one open implementation stack per quest.
- Allow at most two active quest implementations.
- Use only the repository-scoped `GITHUB_TOKEN` and gh-aw safe outputs.
- Explicitly dispatch required checks after each token-created PR or automated
  branch update; stop if the current head SHA does not receive every check.
- Keep intermediate stack layers unmerged until Julia performs the approved
  human stack merge.
- Never push to or merge `main`.
- Only a human may merge the highest approved layer.
- Workflow, agent, skill, governance, CODEOWNER, and validation-script files are
  outside content-refresh ownership.
- External CodeTour findings are recorded in the Buildathon child issue for
  manual maintainer handoff; no external stack is created.
