import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

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
    "githubAppInstalled",
    "copilotCodeReviewEnabled",
    "aiCreditBudgetAvailable",
    "repositoryAdministratorAvailable",
    "refreshBranchCreationAllowed",
    "rulesetConfigured",
    "conversationResolutionRequired",
    "codeOwnerReviewRequired",
    "requiredChecksKnown",
  ];

  check(capabilities.version === 1, "capabilities.json version must be 1");
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
    "capability repositories must exactly match the writable repository allowlist",
  );

  for (const repository of repositories) {
    const prefix = `capabilities for ${repository.name}`;
    check(
      ["unverified", "blocked", "confirmed"].includes(repository.status),
      `${prefix} has an invalid status`,
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

    if (repository.writeAutomationAllowed) {
      check(
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

function validateQuests(config, capabilityRepositories) {
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
        "Azure-Samples/serverless-chat-langchainjs": [
          ".tours/1-rag-overview.tour",
          ".tours/2-document-ingestion.tour",
          ".tours/3-vector-storage.tour",
          ".tours/4-query-retrieval.tour",
          ".tours/5-response-generation.tour",
          ".tours/6-streaming-chat-history.tour",
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
        "Azure-Samples/mcp-agent-langchainjs": [
          ".tours/1-introduction.tour",
          ".tours/2-designing-agents.tour",
          ".tours/3-building-mcp-tools.tour",
          ".tours/4-building-agent-api.tour",
          ".tours/5-backend-api-design.tour",
          ".tours/6-infrastructure-deployment.tour",
        ],
      },
    ],
  ]);
  check(config.version === 1, "quests.json version must be 1");
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
    config.governance?.githubAppIdVariable === "AGENTIC_REFRESH_APP_ID",
    "GitHub App ID variable name is invalid",
  );
  check(
    config.governance?.githubAppPrivateKeySecret ===
      "AGENTIC_REFRESH_APP_PRIVATE_KEY",
    "GitHub App private-key secret name is invalid",
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

    for (const repository of quest.writableRepositories ?? []) {
      check(
        capabilityRepositories.has(repository),
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

function validateGitHubApp(app, expectedRepositories) {
  const exactPermissions = {
    metadata: "read",
    contents: "write",
    pullRequests: "write",
    issues: "write",
    actions: "read",
    checks: "read",
  };

  check(app.version === 1, "github-app.json version must be 1");
  check(
    app.installationScope === "selected-repositories",
    "GitHub App installation must use selected repositories",
  );
  check(
    JSON.stringify([...app.repositories].sort()) ===
      JSON.stringify([...expectedRepositories].sort()),
    "GitHub App repositories must match the writable repository allowlist",
  );
  check(
    JSON.stringify(app.permissions) === JSON.stringify(exactPermissions),
    "GitHub App permissions must match the least-privilege policy",
  );
  check(
    app.constraints?.allowedBranchPrefix === "refresh/",
    "GitHub App branch prefix must be refresh/",
  );
  check(
    app.constraints?.defaultBranchWritesAllowed === false,
    "GitHub App must not write to the default branch",
  );
  check(app.constraints?.mergeAllowed === false, "GitHub App must not merge");
  check(
    app.constraints?.humanMergeRuleset ===
      ".github/agentic-refresh/rulesets/human-merge.json",
    "GitHub App policy must reference the human-only merge ruleset",
  );
  check(
    app.constraints?.installationTokenMaximumLifetimeMinutes <= 60,
    "GitHub App tokens must expire within 60 minutes",
  );
  check(
    app.tokenHandling?.exposedToAgent === false,
    "GitHub App tokens must not be exposed to agents",
  );
  check(
    app.tokenHandling?.consumer === "pinned-deterministic-safe-output-action",
    "GitHub App tokens must be limited to the deterministic safe-output action",
  );
  check(
    app.tokenHandling?.forbiddenOperations?.includes("mergePullRequest") &&
      app.tokenHandling.forbiddenOperations.includes("updateDefaultBranch") &&
      app.tokenHandling.forbiddenOperations.includes("deleteBranch") &&
      app.tokenHandling.forbiddenOperations.includes("forcePush"),
    "GitHub App token policy must forbid merge and destructive operations",
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

const capabilities = await readJson(".github/agentic-refresh/capabilities.json");
const quests = await readJson(".github/agentic-refresh/quests.json");
const labels = await readJson(".github/agentic-refresh/labels.json");
const app = await readJson(".github/agentic-refresh/github-app.json");
const ruleset = await readJson(".github/agentic-refresh/rulesets/main.json");
const humanMergeRuleset = await readJson(
  ".github/agentic-refresh/rulesets/human-merge.json",
);
const tooling = await readJson(".github/agentic-refresh/tooling.json");
const codeowners = await readText(".github/CODEOWNERS");
const copilotSetup = await readText(
  ".github/workflows/copilot-setup-steps.yml",
);
const workflowDirectory = ".github/workflows";
const workflowFiles = (await readdir(resolve(root, workflowDirectory)))
  .filter((name) => /\.ya?ml$/i.test(name))
  .sort();

const expectedRepositories = new Set([
  "Azure-Samples/JavaScript-AI-Buildathon",
  "Azure-Samples/serverless-chat-langchainjs",
  "Azure-Samples/mcp-agent-langchainjs",
]);

validateCapabilities(capabilities, expectedRepositories);
validateQuests(quests, new Set(capabilities.repositories.map(({ name }) => name)));
validateLabels(labels);
validateGitHubApp(app, expectedRepositories);
validateRuleset(ruleset);
validateHumanMergeRuleset(humanMergeRuleset);

check(
  tooling.ghAwVersion === "v0.77.5",
  "tooling.json must pin gh-aw v0.77.5",
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
    `Validated ${quests.quests.length} quests and ${capabilities.repositories.length} report-only repository capability records.`,
  );
}
