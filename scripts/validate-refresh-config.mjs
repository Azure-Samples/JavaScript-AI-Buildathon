import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const resultValues = [
  "material-change",
  "no-material-change",
  "blocked",
];

function check(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

async function readJson(relativePath) {
  const filePath = resolve(root, relativePath);

  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read ${relativePath}: ${error.message}`);
  }
}

async function readText(relativePath) {
  try {
    return await readFile(resolve(root, relativePath), "utf8");
  } catch (error) {
    throw new Error(`Unable to read ${relativePath}: ${error.message}`);
  }
}

function hasUniqueValues(values) {
  return new Set(values).size === values.length;
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, canonicalize(nestedValue)]),
    );
  }

  return value;
}

function sameJson(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function isSafeOwnedPath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("/") &&
    !value.includes("..") &&
    !value.includes("\\") &&
    !/[*?[\]{}]/.test(value.replace(/\/\*\*$/, "")) &&
    (value.endsWith("/**") || !value.includes("*")) &&
    !value.startsWith(".github/") &&
    !value.startsWith("scripts/")
  );
}

function validateCapabilities(capabilities, expectedRepositories) {
  const requiredCapabilities = [
    "repositoryScopedTokenSelected",
    "copilotCodeReviewEnabled",
    "copilotInferenceAvailable",
    "aiCreditBudgetAvailable",
    "repositoryAdministratorAvailable",
    "githubTokenIssueWritesConfirmed",
    "githubTokenPullRequestWritesConfirmed",
    "explicitDispatchChecksConfirmed",
    "refreshBranchCreationAllowed",
    "rulesetConfigured",
    "conversationResolutionRequired",
    "codeOwnerReviewRequired",
    "requiredChecksKnown",
  ];

  check(capabilities.version === 2, "capabilities.json version must be 2");
  check(
    capabilities.defaultMode === "report-only",
    "capabilities.json must default to report-only",
  );
  check(
    Array.isArray(capabilities.repositories),
    "capabilities.json repositories must be an array",
  );

  const repositories = capabilities.repositories ?? [];
  check(
    hasUniqueValues(repositories.map(({ name }) => name)),
    "capability repository names must be unique",
  );
  check(
    JSON.stringify(repositories.map(({ name }) => name).sort()) ===
      JSON.stringify([...expectedRepositories].sort()),
    "capability repositories must exactly match the automation and external evidence repositories",
  );
  check(
    repositories.filter(({ role }) => role === "automation-host").length === 1 &&
      repositories.find(({ role }) => role === "automation-host")?.name ===
        "Azure-Samples/JavaScript-AI-Buildathon",
    "Buildathon must be the only automation host",
  );

  for (const repository of repositories) {
    const prefix = `capabilities for ${repository.name}`;
    check(
      ["unverified", "blocked", "confirmed", "report-only"].includes(
        repository.status,
      ),
      `${prefix} has an invalid status`,
    );
    check(
      ["automation-host", "external-report-only"].includes(repository.role),
      `${prefix} has an invalid role`,
    );
    check(
      typeof repository.writeAutomationAllowed === "boolean",
      `${prefix} must declare writeAutomationAllowed`,
    );

    for (const key of requiredCapabilities) {
      check(
        typeof repository.capabilities?.[key] === "boolean",
        `${prefix} must declare boolean ${key}`,
      );
    }

    if (repository.role === "external-report-only") {
      check(
        repository.status === "report-only" &&
          repository.writeAutomationAllowed === false,
        `${prefix} must remain report-only with writes disabled`,
      );
      check(
        repository.capabilities.repositoryScopedTokenSelected === false,
        `${prefix} must not select a Buildathon workflow token`,
      );
      check(
        [
          "githubTokenIssueWritesConfirmed",
          "githubTokenPullRequestWritesConfirmed",
          "explicitDispatchChecksConfirmed",
          "refreshBranchCreationAllowed",
          "rulesetConfigured",
        ].every((key) => repository.capabilities[key] === false),
        `${prefix} must not declare external write capabilities`,
      );
      check(
        typeof repository.policyReason === "string" &&
          repository.policyReason.length > 0,
        `${prefix} must explain the report-only policy`,
      );
    } else {
      check(
        repository.capabilities.repositoryScopedTokenSelected === true,
        `${prefix} must select the repository-scoped GITHUB_TOKEN`,
      );
    }

    if (repository.writeAutomationAllowed) {
      check(
        repository.role === "automation-host" &&
          repository.status === "confirmed",
        `${prefix} may allow writes only when status is confirmed`,
      );
      check(
        requiredCapabilities.every((key) => repository.capabilities[key]),
        `${prefix} may allow writes only when every capability is true`,
      );
      check(
        Array.isArray(repository.requiredChecks) &&
          repository.requiredChecks.length > 0,
        `${prefix} must list required CI checks before writes are allowed`,
      );
      check(
        typeof repository.approval?.approvedBy === "string" &&
          repository.approval.approvedBy.length > 0,
        `${prefix} must record the administrator approver`,
      );
      check(
        typeof repository.approval?.approvedAt === "string" &&
          !Number.isNaN(Date.parse(repository.approval.approvedAt)),
        `${prefix} must record a valid approval timestamp`,
      );
      check(
        typeof repository.approval?.evidence === "string" &&
          repository.approval.evidence.length > 0,
        `${prefix} must record approval evidence`,
      );
      check(
        Array.isArray(repository.blockers) && repository.blockers.length === 0,
        `${prefix} cannot allow writes while blockers remain`,
      );
    }
  }
}

function validateQuests(config, capabilityByRepository) {
  const expectedOwnedPaths = new Map([
    [
      1,
      {
        "Azure-Samples/JavaScript-AI-Buildathon": [
          "01-Local-AI-Development/**",
          "README.md",
          "docs/quests.md",
        ],
      },
    ],
    [
      2,
      {
        "Azure-Samples/JavaScript-AI-Buildathon": [
          "02-E2E-Model-Development-on-Foundry/**",
          "README.md",
          "docs/quests.md",
        ],
      },
    ],
    [
      3,
      {
        "Azure-Samples/JavaScript-AI-Buildathon": [
          "03-Run-Serverless-RAG-Support-System/**",
          "README.md",
          "docs/quests.md",
        ],
      },
    ],
    [
      4,
      {
        "Azure-Samples/JavaScript-AI-Buildathon": [
          "04-Build-Agents-with-AIToolKit/**",
          "README.md",
          "docs/quests.md",
        ],
      },
    ],
    [
      5,
      {
        "Azure-Samples/JavaScript-AI-Buildathon": [
          "05-Run-Burger-Ordering-Agent-System/**",
          "README.md",
          "docs/quests.md",
        ],
      },
    ],
  ]);
  const expectedExternalReports = new Map([
    [1, []],
    [2, []],
    [
      3,
      [
        {
          repository: "Azure-Samples/serverless-chat-langchainjs",
          mode: "report-only",
          handoff: "manual-maintainer",
          observedPaths: [
            ".tours/1-rag-overview.tour",
            ".tours/2-document-ingestion.tour",
            ".tours/3-vector-storage.tour",
            ".tours/4-query-retrieval.tour",
            ".tours/5-response-generation.tour",
            ".tours/6-streaming-chat-history.tour",
          ],
        },
      ],
    ],
    [4, []],
    [
      5,
      [
        {
          repository: "Azure-Samples/mcp-agent-langchainjs",
          mode: "report-only",
          handoff: "manual-maintainer",
          observedPaths: [
            ".tours/1-introduction.tour",
            ".tours/2-designing-agents.tour",
            ".tours/3-building-mcp-tools.tour",
            ".tours/4-building-agent-api.tour",
            ".tours/5-backend-api-design.tour",
            ".tours/6-infrastructure-deployment.tour",
          ],
        },
      ],
    ],
  ]);
  check(config.version === 2, "quests.json version must be 2");
  check(config.schedule?.cron === "0 8 * * 1", "weekly cron must be 0 8 * * 1");
  check(config.schedule?.timezone === "UTC", "weekly schedule timezone must be UTC");
  check(
    config.governance?.defaultMode === "report-only",
    "quest governance must default to report-only",
  );
  check(
    config.governance?.approvalCommand === "/approve-refresh",
    "approval command must be /approve-refresh",
  );
  check(
    config.governance?.approverVariable === "REFRESH_APPROVER_LOGIN",
    "approver variable must be REFRESH_APPROVER_LOGIN",
  );
  check(
    config.governance?.tokenPolicyFile ===
      ".github/agentic-refresh/github-token.json",
    "token policy file must reference github-token.json",
  );
  check(
    config.governance?.tokenModel === "repository-scoped-github-token",
    "token model must use the repository-scoped GITHUB_TOKEN",
  );
  check(
    config.governance?.crossRepositoryWritesAllowed === false &&
      config.governance?.externalRepositoryMode === "report-only",
    "cross-repository writes must be disabled and external repositories report-only",
  );
  check(
    config.governance?.maximumActiveImplementations === 2,
    "maximum active implementations must be 2",
  );
  check(
    config.governance?.maximumAssetRevisionRounds === 2,
    "maximum asset revision rounds must be 2",
  );
  check(
    config.governance?.maximumCopilotReviewRounds === 2,
    "maximum Copilot review rounds must be 2",
  );

  try {
    const branchPattern = new RegExp(config.governance?.branchPattern);
    check(
      branchPattern.test("refresh/2026-W30/foundry-local/01-core"),
      "branch pattern must accept the core branch shape",
    );
    check(
      !branchPattern.test("main"),
      "branch pattern must reject the default branch",
    );
    check(
      !branchPattern.test("refresh/2026-W30/agentic-rag/01-sample"),
      "branch pattern must reject external sample branches",
    );
    check(
      !branchPattern.test("refresh/2026-W30/agentic-rag/02-codetour"),
      "branch pattern must reject external CodeTour branches",
    );
  } catch {
    errors.push("branch pattern must be a valid regular expression");
  }

  const quests = config.quests ?? [];
  check(quests.length === 5, "quests.json must define exactly five quests");
  check(
    JSON.stringify(quests.map(({ id }) => id).sort()) ===
      JSON.stringify([1, 2, 3, 4, 5]),
    "quest IDs must be exactly 1 through 5",
  );
  check(
    hasUniqueValues(quests.map(({ slug }) => slug)),
    "quest slugs must be unique",
  );

  for (const quest of quests) {
    const prefix = `quest ${quest.id}`;
    check(
      typeof quest.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(quest.slug),
      `${prefix} has an invalid slug`,
    );
    check(
      typeof quest.agent === "string" && quest.agent.endsWith("-quest-master"),
      `${prefix} must use a quest-master agent`,
    );
    check(
      Array.isArray(quest.officialSourcePrefixes) &&
        quest.officialSourcePrefixes.length > 0,
      `${prefix} must define official source prefixes`,
    );
    check(
      hasUniqueValues(quest.officialSourcePrefixes ?? []),
      `${prefix} official source prefixes must be unique`,
    );

    for (const source of quest.officialSourcePrefixes ?? []) {
      check(
        typeof source === "string" &&
          source.startsWith("https://") &&
          !source.includes("*"),
        `${prefix} has an invalid official source prefix: ${source}`,
      );
    }

    for (const repository of quest.sourceRepositories ?? []) {
      check(
        /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository),
        `${prefix} has an invalid source repository: ${repository}`,
      );
    }

    check(
      Array.isArray(quest.writableRepositories) &&
        quest.writableRepositories.length > 0,
      `${prefix} must define writable repositories`,
    );
    check(
      hasUniqueValues(quest.writableRepositories ?? []),
      `${prefix} writable repositories must be unique`,
    );
    check(
      JSON.stringify(quest.writableRepositories) ===
        JSON.stringify(["Azure-Samples/JavaScript-AI-Buildathon"]),
      `${prefix} may write only to the Buildathon repository`,
    );

    for (const repository of quest.writableRepositories ?? []) {
      check(
        capabilityByRepository.has(repository),
        `${prefix} writable repository is missing from capabilities.json: ${repository}`,
      );
      check(
        Array.isArray(quest.ownedPaths?.[repository]) &&
          quest.ownedPaths[repository].length > 0,
        `${prefix} must define owned paths for ${repository}`,
      );
    }

    for (const [repository, paths] of Object.entries(quest.ownedPaths ?? {})) {
      check(
        quest.writableRepositories?.includes(repository),
        `${prefix} has owned paths for a non-writable repository: ${repository}`,
      );
      check(
        hasUniqueValues(paths),
        `${prefix} owned paths for ${repository} must be unique`,
      );

      for (const ownedPath of paths) {
        check(
          isSafeOwnedPath(ownedPath),
          `${prefix} has unsafe owned path: ${ownedPath}`,
        );
      }
    }

    check(
      JSON.stringify(quest.ownedPaths) ===
        JSON.stringify(expectedOwnedPaths.get(quest.id)),
      `${prefix} owned paths must exactly match the reviewed path allowlist`,
    );
    check(
      JSON.stringify(quest.externalReports) ===
        JSON.stringify(expectedExternalReports.get(quest.id)),
      `${prefix} external reports must exactly match the reviewed report-only allowlist`,
    );

    for (const externalReport of quest.externalReports ?? []) {
      check(
        externalReport.mode === "report-only" &&
          externalReport.handoff === "manual-maintainer",
        `${prefix} external reports must require manual maintainer handoff`,
      );
      check(
        quest.sourceRepositories?.includes(externalReport.repository),
        `${prefix} external report repository must be an allowlisted source repository`,
      );
      check(
        !quest.writableRepositories?.includes(externalReport.repository),
        `${prefix} external report repository must not be writable`,
      );
      check(
        capabilityByRepository.get(externalReport.repository)?.role ===
            "external-report-only" &&
          capabilityByRepository.get(externalReport.repository)
              ?.writeAutomationAllowed === false,
        `${prefix} external report repository must have a report-only capability record`,
      );
      for (const observedPath of externalReport.observedPaths ?? []) {
        check(
          isSafeOwnedPath(observedPath),
          `${prefix} has unsafe external observed path: ${observedPath}`,
        );
      }
    }
  }
}

function validateLabels(labels) {
  const requiredLabels = [
    "refresh/plan",
    "refresh/awaiting-approval",
    "refresh/approved",
    "refresh/implementing",
    "refresh/asset-review",
    "refresh/copilot-review",
    "refresh/human-review",
    "refresh/docs",
    "refresh/final-review",
    "refresh/blocked",
    "refresh/completed",
    "quest/1-foundry-local",
    "quest/2-microsoft-foundry",
    "quest/3-agentic-rag",
    "quest/4-foundry-toolkit",
    "quest/5-context-engineering",
  ];
  const configuredLabels = labels.labels?.map(({ name }) => name) ?? [];

  check(labels.version === 1, "labels.json version must be 1");
  check(
    hasUniqueValues(configuredLabels),
    "label names must be unique",
  );
  check(
    JSON.stringify([...configuredLabels].sort()) ===
      JSON.stringify([...requiredLabels].sort()),
    "labels.json must define the complete refresh state and quest label set",
  );

  for (const label of labels.labels ?? []) {
    check(/^[0-9a-f]{6}$/i.test(label.color), `label ${label.name} has invalid color`);
    check(
      typeof label.description === "string" && label.description.length > 0,
      `label ${label.name} must have a description`,
    );
  }
}

function validateGitHubTokenPolicy(policy) {
  const expectedPermissions = {
    discoveryReport: {
      contents: "read",
      issues: "write",
      "copilot-requests": "write",
    },
    implementation: {
      contents: "write",
      issues: "write",
      "pull-requests": "write",
      "copilot-requests": "write",
    },
    validationDispatch: {
      actions: "write",
      contents: "read",
    },
  };
  const allowedOperations = [
    "createRefreshBranch",
    "updateRefreshBranch",
    "createPullRequest",
    "updatePullRequest",
    "createIssue",
    "updateIssue",
    "comment",
  ];
  const forbiddenOperations = [
    "mergePullRequest",
    "updateDefaultBranch",
    "deleteBranch",
    "forcePush",
    "writeExternalRepository",
  ];

  check(policy.version === 1, "github-token.json version must be 1");
  check(policy.token === "GITHUB_TOKEN", "token policy must use GITHUB_TOKEN");
  check(
    policy.scope === "current-repository-only" &&
      policy.constraints?.allowedRepository ===
        "Azure-Samples/JavaScript-AI-Buildathon",
    "GITHUB_TOKEN must be scoped to the Buildathon repository",
  );
  check(
    policy.storedSecretRequired === false &&
      policy.personalTokenFallbackAllowed === false,
    "token policy must not require or permit a stored personal token",
  );
  check(
    policy.crossRepositoryWritesAllowed === false &&
      policy.externalRepositories?.mode === "report-only" &&
      policy.externalRepositories?.manualHandoffRequired === true,
    "external repositories must remain report-only with manual handoff",
  );
  check(
    policy.copilotInference?.permission === "copilot-requests: write" &&
      policy.copilotInference?.personalTokenFallbackAllowed === false,
    "Copilot inference must use copilot-requests: write without PAT fallback",
  );
  check(
    sameJson(policy.permissionsByOperation, expectedPermissions),
    "token policy permissions must exactly match the reviewed least-privilege groups",
  );
  check(
    policy.constraints?.allowedBranchPrefix === "refresh/" &&
      policy.constraints?.defaultBranchWritesAllowed === false &&
      policy.constraints?.mergeAllowed === false,
    "token policy must restrict branches and forbid default-branch writes and merge",
  );
  check(
    policy.writeHandling?.agentGitHubTools === "read-only" &&
      policy.writeHandling?.consumer === "gh-aw-safe-outputs",
    "agent tools must be read-only and writes limited to gh-aw safe outputs",
  );
  check(
    sameJson(
      [...(policy.writeHandling?.allowedOperations ?? [])].sort(),
      [...allowedOperations].sort(),
    ),
    "token policy allowed operations must exactly match the reviewed safe-output allowlist",
  );
  check(
    forbiddenOperations.every((operation) =>
      policy.writeHandling?.forbiddenOperations?.includes(operation),
    ),
    "token policy must forbid merge, destructive, and cross-repository operations",
  );
  check(
    allowedOperations.every(
      (operation) =>
        !policy.writeHandling?.forbiddenOperations?.includes(operation),
    ),
    "token policy allowed and forbidden operations must not overlap",
  );
  check(
    policy.eventModel?.tokenGeneratedEventsTriggerWorkflows === false &&
      policy.eventModel?.explicitDispatchRequiredAfterPullRequestCreation ===
        true &&
      policy.eventModel?.explicitDispatchRequiredAfterRefreshBranchUpdate ===
        true &&
      policy.eventModel?.requiredCheckDispatchMustBeProvenBeforeWrites === true,
    "token policy must account for GITHUB_TOKEN event suppression",
  );
}

function validateRuleset(ruleset) {
  const ruleTypes = new Set(ruleset.rules?.map(({ type }) => type));
  const statusRule = ruleset.rules?.find(
    ({ type }) => type === "required_status_checks",
  );
  const statusContexts =
    statusRule?.parameters?.required_status_checks?.map(({ context }) => context) ??
    [];
  const pullRequestRule = ruleset.rules?.find(
    ({ type }) => type === "pull_request",
  );

  check(ruleset.enforcement === "disabled", "ruleset template must be disabled");
  check(
    ruleset.conditions?.ref_name?.include?.includes("~DEFAULT_BRANCH"),
    "ruleset template must target the default branch",
  );
  check(ruleTypes.has("deletion"), "ruleset must block branch deletion");
  check(ruleTypes.has("non_fast_forward"), "ruleset must block force-pushes");
  check(ruleTypes.has("pull_request"), "ruleset must require pull requests");
  check(
    pullRequestRule?.parameters?.require_code_owner_review === true,
    "ruleset must require CODEOWNER review",
  );
  check(
    pullRequestRule?.parameters?.required_review_thread_resolution === true,
    "ruleset must require conversation resolution",
  );
  check(
    statusContexts.includes("validate-content") &&
      statusContexts.includes("validate-agentic-workflows"),
    "ruleset must require both Phase 0 validation checks",
  );
  check(
    Array.isArray(ruleset.bypass_actors) && ruleset.bypass_actors.length === 0,
    "main protection ruleset must not have bypass actors",
  );
}

function validateHumanMergeRuleset(ruleset) {
  const updateRule = ruleset.rules?.find(({ type }) => type === "update");
  const bypassActor = ruleset.bypass_actors?.[0];

  check(
    ruleset.enforcement === "disabled",
    "human merge ruleset template must be disabled",
  );
  check(
    ruleset.conditions?.ref_name?.include?.includes("~DEFAULT_BRANCH"),
    "human merge ruleset must target the default branch",
  );
  check(
    ruleset.rules?.length === 1 && updateRule,
    "human merge ruleset must contain only an update restriction",
  );
  check(
    updateRule?.parameters?.update_allows_fetch_and_merge === false,
    "human merge update restriction must not allow fetch-and-merge updates",
  );
  check(
    ruleset.bypass_actors?.length === 1 &&
      bypassActor?.actor_id === 40116776 &&
      bypassActor?.actor_type === "User" &&
      bypassActor?.bypass_mode === "pull_request",
    "human merge ruleset must allow only Julia through pull requests",
  );
}

function validatePinnedActions(workflowText, workflowPath) {
  const actionPattern = /^\s*(?:-\s*)?uses\s*:\s*([^#\s]+).*$/gm;

  for (const match of workflowText.matchAll(actionPattern)) {
    const action = match[1];
    if (action.startsWith("./") || action.startsWith("docker://")) {
      continue;
    }

    check(
      /@[0-9a-f]{40}$/i.test(action),
      `${workflowPath} must pin action to a full commit SHA: ${action}`,
    );
  }
}

function readFrontmatter(text, filePath) {
  check(text.startsWith("---\n"), `${filePath} must start with frontmatter`);
  const end = text.indexOf("\n---\n", 4);
  check(end > 0, `${filePath} must close its frontmatter`);
  return end > 0 ? text.slice(4, end) : "";
}

function readYamlList(frontmatter, key) {
  const match = frontmatter.match(
    new RegExp(`^${key}:\\s*\\n((?: {2,}- [^\\n]+\\n?)+)`, "m"),
  );
  if (!match) {
    return [];
  }

  return match[1]
    .split("\n")
    .filter(Boolean)
    .map((line) => line.replace(/^\s*-\s*/, "").replace(/^["']|["']$/g, ""));
}

function validateDiscoveryPolicy(policyText) {
  const frontmatter = readFrontmatter(
    policyText,
    ".github/workflows/shared/discovery-policy.md",
  );
  const expectedCommands = [
    "cat *",
    "find *",
    "gh api *",
    "gh repo view *",
    "gh search code *",
    "grep *",
    "jq *",
    "sed *",
    "wc *",
  ];
  const bashMatch = frontmatter.match(
    /^  bash:\s*\n((?: {4}- [^\n]+\n?)+)/m,
  );
  const commands = bashMatch
    ? bashMatch[1]
        .split("\n")
        .filter(Boolean)
        .map((line) =>
          line.replace(/^\s*-\s*/, "").replace(/^["']|["']$/g, ""),
        )
    : [];

  check(
    !/^\s{2}(?:contents|issues|pull-requests|actions):\s*write$/m.test(
      frontmatter,
    ),
    "discovery policy must not grant repository mutation permissions",
  );
  check(
    /^\s{2}github:\s*$/m.test(frontmatter) &&
      /^\s{4}mode:\s*gh-proxy$/m.test(frontmatter) &&
      /^\s{2}web-fetch:\s*$/m.test(frontmatter),
    "discovery policy must expose only reviewed GitHub and web retrieval tools",
  );
  check(
    sameJson(commands, expectedCommands),
    "discovery policy bash commands must exactly match the reviewed read-only allowlist",
  );
  check(
    !/^\s{2}edit:\s*$/m.test(frontmatter),
    "discovery policy must not enable edit",
  );
  check(
    !/^safe-outputs:\s*$/m.test(frontmatter),
    "shared discovery policy must leave output suppression to each main workflow",
  );
  check(
    policyText.includes("`emit_weekly_report`") &&
      policyText.includes("Result: no-material-change") &&
      policyText.includes("Result: blocked"),
    "discovery policy must define the staged report output and explicit outcomes",
  );
}

function validateDiscoveryWorkflow(
  quest,
  specification,
  workflowText,
  agentText,
  compiledText,
) {
  const workflowPath = `.github/workflows/${specification.workflow}`;
  const agentPath = `.github/agents/${quest.agent}.agent.md`;
  const frontmatter = readFrontmatter(workflowText, workflowPath);
  const agentFrontmatter = readFrontmatter(agentText, agentPath);
  const allowedDomains = readYamlList(frontmatter, "network:\\n  allowed");
  const agentBlocks = [
    ...workflowText.matchAll(/^## agent: `([a-z][a-z0-9_-]*)`$/gm),
  ].map((match) => match[1]);
  const expectedAgentBlocks = [
    "official-source-researcher",
    "buildathon-content-auditor",
    ...(quest.externalReports.length > 0
      ? ["external-codetour-auditor"]
      : []),
  ];

  check(
    /^\s{2}workflow_call:\s*$/m.test(frontmatter) &&
      /^\s{2}workflow_dispatch:\s*$/m.test(frontmatter) &&
      !/^\s{2}schedule:\s*$/m.test(frontmatter),
    `${workflowPath} must support manual and reusable Phase 2A runs without a schedule`,
  );
  check(
    /^strict:\s*true$/m.test(frontmatter),
    `${workflowPath} must enable strict mode`,
  );
  check(
    /^permissions:\s*\n  contents:\s*read\s*\n  copilot-requests:\s*write$/m.test(
      frontmatter,
    ),
    `${workflowPath} must grant only repository read and Copilot inference permissions`,
  );
  check(
    new RegExp(`^  agent:\\s*${quest.agent}$`, "m").test(frontmatter),
    `${workflowPath} must select ${quest.agent}`,
  );
  check(
    frontmatter.includes("shared/discovery-policy.md") &&
      frontmatter.includes("uses: shared/report-output.md") &&
      frontmatter.includes(`quest-id: ${quest.id}`) &&
      frontmatter.includes(`quest-slug: ${quest.slug}`) &&
      frontmatter.includes(`quest-title: ${quest.title}`) &&
      frontmatter.includes(`quest-label: quest/${quest.id}-${quest.slug}`) &&
      frontmatter.includes(`../agents/${quest.agent}.agent.md`),
    `${workflowPath} must import the reporting policy and exactly scoped Quest Master`,
  );
  check(
    sameJson(allowedDomains, specification.domains),
    `${workflowPath} network domains must exactly match the reviewed quest allowlist`,
  );
  check(
    /^safe-outputs:\s*\n  activation-comments:\s*false\s*\n  missing-data:\s*false\s*\n  missing-tool:\s*false\s*\n  noop:\s*false\s*\n  report-failure-as-issue:\s*false\s*\n  report-incomplete:\s*false\s*\n  staged:\s*true\s*\n  threat-detection:\s*false$/m.test(
      frontmatter,
    ) &&
      !/^\s{2}(?:create-|update-|add-|push-|dispatch-|close-|assign-|upload-)/m.test(
        frontmatter,
      ) &&
      !/^\s{2}(?:contents|issues|pull-requests|actions):\s*write$/m.test(
        frontmatter,
      ),
    `${workflowPath} must disable automatic writes and retain staged output processing`,
  );
  check(
    compiledText.includes('GH_AW_FAILURE_REPORT_AS_ISSUE: "false"') &&
      compiledText.includes('GH_AW_SAFE_OUTPUTS_STAGED: "true"') &&
      compiledText.includes("emit_weekly_report") &&
      compiledText.includes("weekly-refresh-report.mjs materialize"),
    `${workflowPath} compiled reporting output must remain disabled for writes and staged`,
  );
  check(
    !/^\s{6}(?:contents|issues|pull-requests|actions|checks):\s*write$/m.test(
        compiledText,
      ),
    `${workflowPath} compiled jobs must not grant repository write permissions`,
  );
  check(
    sameJson(agentBlocks, expectedAgentBlocks),
    `${workflowPath} inline researchers must exactly match the reviewed topology`,
  );
  check(
    workflowText.includes(`quest slug \`${quest.slug}\``) &&
      workflowText.includes("${{ inputs.week_key }}") &&
      workflowText.includes("${{ inputs.prior_week_key }}") &&
      workflowText.includes("`emit_weekly_report`") &&
      workflowText.includes("Do not create or update"),
    `${workflowPath} must declare its fixed quest, reporting context, and read-only outcome`,
  );
  check(
    new RegExp(`^name:\\s*${quest.agent}$`, "m").test(agentFrontmatter) &&
      /^disable-model-invocation:\s*true$/m.test(agentFrontmatter),
    `${agentPath} must define the expected non-invocable Quest Master profile`,
  );

  for (const source of quest.officialSourcePrefixes) {
    check(
      agentText.includes(source) && workflowText.includes(source),
      `${agentPath} and ${workflowPath} must include approved source ${source}`,
    );
  }
  for (const paths of Object.values(quest.ownedPaths)) {
    for (const ownedPath of paths) {
      check(
        agentText.includes(ownedPath) && workflowText.includes(ownedPath),
        `${agentPath} and ${workflowPath} must include owned path ${ownedPath}`,
      );
    }
  }
  for (const externalReport of quest.externalReports) {
    check(
      agentText.includes(externalReport.repository) &&
        workflowText.includes(externalReport.repository) &&
        agentText.includes("manual-maintainer") &&
        workflowText.includes("manual-maintainer"),
      `${agentPath} and ${workflowPath} must preserve the external manual-handoff boundary`,
    );
    for (const observedPath of externalReport.observedPaths) {
      check(
        workflowText.includes(observedPath),
        `${workflowPath} must include observed path ${observedPath}`,
      );
    }
  }
}

function validateReportOutput(reportOutputText, actionsLock) {
  const path = ".github/workflows/shared/report-output.md";
  const frontmatter = readFrontmatter(reportOutputText, path);
  const checkoutPin =
    actionsLock.entries["actions/checkout@v6.0.2"]?.sha;
  const uploadPin =
    actionsLock.entries["actions/upload-artifact@v7.0.1"]?.sha;

  check(
    ["quest-id", "quest-slug", "quest-title", "quest-label"].every((field) =>
      new RegExp(`^  ${field}:\\s*$`, "m").test(frontmatter),
    ),
    `${path} must define the exact parameterized quest identity`,
  );
  check(
    /^\s{4}emit-weekly-report:\s*$/m.test(frontmatter) &&
      frontmatter.includes("needs: agent") &&
      frontmatter.includes("if: always()") &&
      frontmatter.includes("type: choice") &&
      frontmatter.includes("report_json:"),
    `${path} must define one structured report materializer job`,
  );
  check(
    frontmatter.includes(
      `actions/checkout@${checkoutPin}`,
    ) &&
      frontmatter.includes(
        `actions/upload-artifact@${uploadPin}`,
      ) &&
      frontmatter.includes("weekly-refresh-report.mjs materialize") &&
      frontmatter.includes('"$GH_AW_AGENT_OUTPUT"'),
    `${path} must materialize and upload reports with pinned actions`,
  );
  check(
    !/^\s+(?:contents|issues|pull-requests|actions|checks|statuses):\s*write$/m.test(
      frontmatter,
    ),
    `${path} must not grant a repository write permission`,
  );
  check(
    reportOutputText.includes("schemaVersion") &&
      reportOutputText.includes("officialSourceDeltas") &&
      reportOutputText.includes("priorFindingKeys") &&
      reportOutputText.includes("blockedReason") &&
      reportOutputText.includes("Call `emit_weekly_report` exactly once"),
    `${path} must expose the complete versioned report contract`,
  );
  validatePinnedActions(reportOutputText, path);
}

function validateDigestWorkflow(digestText, compiledText, tooling) {
  const path = ".github/workflows/weekly-refresh-digest.md";
  const frontmatter = readFrontmatter(digestText, path);

  check(
    /^\s{2}workflow_call:\s*$/m.test(frontmatter) &&
      !/^\s{2}workflow_dispatch:\s*$/m.test(frontmatter) &&
      !/^\s{2}schedule:\s*$/m.test(frontmatter),
    `${path} must be reusable only; the orchestrator owns manual activation`,
  );
  check(
    /^permissions:\s*\n  actions:\s*read\s*\n  contents:\s*read\s*\n  copilot-requests:\s*write$/m.test(
      frontmatter,
    ),
    `${path} must grant only artifact, repository-read, and inference permissions`,
  );
  check(
    /^network:\s*\{\}$/m.test(frontmatter),
    `${path} must deny agent network access`,
  );
  check(
    frontmatter.includes(tooling.downloadArtifactAction) &&
      frontmatter.includes(tooling.uploadArtifactAction) &&
      frontmatter.includes("weekly-refresh-report.mjs digest") &&
      frontmatter.includes("continue-on-error: true") &&
      frontmatter.includes("merge-multiple: true"),
    `${path} must tolerate missing quest artifacts and build a pinned deterministic preview`,
  );
  check(
    /^safe-outputs:\s*\n  activation-comments:\s*false\s*\n  missing-data:\s*false\s*\n  missing-tool:\s*false\s*\n  noop:\s*false\s*\n  report-failure-as-issue:\s*false\s*\n  report-incomplete:\s*false\s*\n  staged:\s*true\s*\n  threat-detection:\s*false$/m.test(
      frontmatter,
    ),
    `${path} must keep every framework output staged and suppressed`,
  );
  check(
    compiledText.includes('GH_AW_SAFE_OUTPUTS_STAGED: "true"') &&
      compiledText.includes("weekly-refresh-report.mjs digest") &&
      !/^\s+(?:contents|issues|pull-requests|actions|checks|statuses):\s*write$/m.test(
        compiledText,
      ),
    `${path} compiled workflow must remain staged and free of repository writes`,
  );
  check(
    digestText.includes("exactly five quest results") &&
      digestText.includes("child preview exists only") &&
      digestText.includes("Do not create or update"),
    `${path} must audit the deterministic five-quest preview without mutation`,
  );
  validatePinnedActions(digestText, path);
}

function validateOrchestrator(orchestratorText, quests, tooling) {
  const path = ".github/workflows/weekly-refresh-orchestrator.yml";
  const discoveryUses = [
    ...orchestratorText.matchAll(
      /uses:\s*\.\/\.github\/workflows\/(discover-[a-z-]+\.lock\.yml)/g,
    ),
  ].map((match) => match[1]);
  const expectedUses = quests.quests
    .map(({ slug }) => `discover-${slug}.lock.yml`)
    .sort();

  check(
    /^\s{2}workflow_dispatch:\s*$/m.test(orchestratorText) &&
      !/^\s{2}schedule:\s*$/m.test(orchestratorText),
    `${path} must remain manual-only in Phase 2A`,
  );
  check(
    orchestratorText.includes("0 8 * * 1") &&
      orchestratorText.includes("Phase 2B"),
    `${path} must document but not activate the intended Monday schedule`,
  );
  check(
    /^permissions:\s*\n  actions:\s*read\s*\n  contents:\s*read\s*\n  copilot-requests:\s*write$/m.test(
      orchestratorText,
    ) &&
      !/^\s+(?:contents|issues|pull-requests|actions|checks|statuses):\s*write$/m.test(
        orchestratorText,
      ),
    `${path} must grant only read and inference permissions`,
  );
  check(
    sameJson(discoveryUses.sort(), expectedUses) &&
      discoveryUses.length === quests.quests.length,
    `${path} must fan out to each discovery workflow exactly once`,
  );
  check(
    orchestratorText.includes("weekly-refresh-report.mjs context") &&
      orchestratorText.includes("prior_week_key") &&
      orchestratorText.includes("always() && needs.context.result == 'success'") &&
      orchestratorText.includes(
        "uses: ./.github/workflows/weekly-refresh-digest.lock.yml",
      ),
    `${path} must use one week algorithm and run the digest after every quest outcome`,
  );
  check(
    orchestratorText.includes(tooling.checkoutAction),
    `${path} must use the reviewed checkout action pin`,
  );
  validatePinnedActions(orchestratorText, path);
}

function validateReportContract(reportContractText) {
  check(
    reportContractText.includes("version 1 JSON artifact") &&
      resultValues.every((result) => reportContractText.includes(result)) &&
      reportContractText.includes("deterministic parent key") &&
      reportContractText.includes("child issue Markdown preview only") &&
      reportContractText.includes("No Phase 2A workflow creates or updates"),
    "report-contract.md must define the Phase 2A schema, outcomes, identifiers, and no-write boundary",
  );
}

const capabilities = await readJson(".github/agentic-refresh/capabilities.json");
const quests = await readJson(".github/agentic-refresh/quests.json");
const labels = await readJson(".github/agentic-refresh/labels.json");
const tokenPolicy = await readJson(
  ".github/agentic-refresh/github-token.json",
);
const ruleset = await readJson(".github/agentic-refresh/rulesets/main.json");
const humanMergeRuleset = await readJson(
  ".github/agentic-refresh/rulesets/human-merge.json",
);
const tooling = await readJson(".github/agentic-refresh/tooling.json");
const actionsLock = await readJson(".github/aw/actions-lock.json");
const codeowners = await readText(".github/CODEOWNERS");
const copilotSetup = await readText(
  ".github/workflows/copilot-setup-steps.yml",
);
const workflowDirectory = ".github/workflows";
const workflowFiles = (await readdir(resolve(root, workflowDirectory)))
  .filter((name) => /\.ya?ml$/i.test(name))
  .sort();
const discoveryPolicy = await readText(
  ".github/workflows/shared/discovery-policy.md",
);
const reportOutput = await readText(
  ".github/workflows/shared/report-output.md",
);
const reportContract = await readText(
  ".github/agentic-refresh/report-contract.md",
);
const digestWorkflow = await readText(
  ".github/workflows/weekly-refresh-digest.md",
);
const digestCompiledWorkflow = await readText(
  ".github/workflows/weekly-refresh-digest.lock.yml",
);
const weeklyOrchestrator = await readText(
  ".github/workflows/weekly-refresh-orchestrator.yml",
);
const discoverySpecifications = new Map([
  [
    "foundry-local",
    {
      workflow: "discover-foundry-local.md",
      domains: ["www.foundrylocal.ai"],
    },
  ],
  [
    "microsoft-foundry",
    {
      workflow: "discover-microsoft-foundry.md",
      domains: ["learn.microsoft.com"],
    },
  ],
  [
    "agentic-rag",
    {
      workflow: "discover-agentic-rag.md",
      domains: ["docs.langchain.com"],
    },
  ],
  [
    "foundry-toolkit",
    {
      workflow: "discover-foundry-toolkit.md",
      domains: [
        "code.visualstudio.com",
        "marketplace.visualstudio.com",
      ],
    },
  ],
  [
    "context-engineering",
    {
      workflow: "discover-context-engineering.md",
      domains: ["docs.langchain.com", "modelcontextprotocol.io"],
    },
  ],
]);

const expectedRepositories = new Set([
  "Azure-Samples/JavaScript-AI-Buildathon",
  "Azure-Samples/serverless-chat-langchainjs",
  "Azure-Samples/mcp-agent-langchainjs",
]);

validateCapabilities(capabilities, expectedRepositories);
validateQuests(
  quests,
  new Map(
    capabilities.repositories.map((repository) => [
      repository.name,
      repository,
    ]),
  ),
);
validateLabels(labels);
validateGitHubTokenPolicy(tokenPolicy);
validateRuleset(ruleset);
validateHumanMergeRuleset(humanMergeRuleset);
validateDiscoveryPolicy(discoveryPolicy);
validateReportOutput(reportOutput, actionsLock);
validateDigestWorkflow(digestWorkflow, digestCompiledWorkflow, tooling);
validateOrchestrator(weeklyOrchestrator, quests, tooling);
validateReportContract(reportContract);

for (const quest of quests.quests) {
  const specification = discoverySpecifications.get(quest.slug);
  check(specification, `missing Phase 1 discovery specification for ${quest.slug}`);
  if (!specification) {
    continue;
  }
  validateDiscoveryWorkflow(
    quest,
    specification,
    await readText(`${workflowDirectory}/${specification.workflow}`),
    await readText(`.github/agents/${quest.agent}.agent.md`),
    await readText(
      `${workflowDirectory}/${specification.workflow.replace(/\.md$/, ".lock.yml")}`,
    ),
  );
}

check(
  tooling.ghAwVersion === "v0.77.5",
  "tooling.json must pin gh-aw v0.77.5",
);
check(
  tooling.downloadArtifactAction ===
    `actions/download-artifact@${actionsLock.entries["actions/download-artifact@v8.0.1"]?.sha}` &&
    tooling.uploadArtifactAction ===
      `actions/upload-artifact@${actionsLock.entries["actions/upload-artifact@v7.0.1"]?.sha}`,
  "tooling.json artifact action pins must match the gh-aw action lock",
);
check(
  copilotSetup.includes(tooling.ghAwSetupAction) &&
    copilotSetup.includes(`version: ${tooling.ghAwVersion}`),
  "Copilot setup must use the pinned gh-aw action and version",
);
check(
  codeowners.includes("* @juliamuiruri4 @BethanyJep"),
  "CODEOWNERS must include Julia and the independent fallback reviewer",
);

for (const workflowFile of workflowFiles) {
  validatePinnedActions(
    await readText(`${workflowDirectory}/${workflowFile}`),
    workflowFile,
  );
}

if (errors.length > 0) {
  console.error("Agentic refresh configuration is invalid:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${quests.quests.length} quests, ${discoverySpecifications.size} staged reporting workflows, the weekly digest/orchestrator, and ${capabilities.repositories.length} repository capability records.`,
  );
}
