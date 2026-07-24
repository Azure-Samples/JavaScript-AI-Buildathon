import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const resultValues = [
  "material-change",
  "no-material-change",
  "blocked",
];
const lifecycleValues = [
  "GA",
  "Public preview",
  "Private preview",
  "Not stated by allowed sources",
];
const learnerImpactValues = ["high", "medium", "low", "none"];
const coreKeys = [
  "schemaVersion",
  "weekKey",
  "priorWeekKey",
  "questSlug",
  "result",
  "executiveSummary",
  "currentQuestStatus",
  "learnerImpact",
  "officialSourceDeltas",
  "contentDrift",
  "proposedChanges",
  "assetImpact",
  "codeTourImpact",
  "validationPlan",
  "risks",
  "humanDecisions",
  "sourceFingerprints",
  "priorFindingKeys",
  "blockedReason",
];

function parseArguments(argv) {
  const [command, ...values] = argv;
  const options = {};

  for (let index = 0; index < values.length; index += 2) {
    const flag = values[index];
    const value = values[index + 1];
    if (!flag?.startsWith("--") || value === undefined) {
      throw new Error(`Invalid argument sequence near ${flag ?? "<end>"}`);
    }
    options[flag.slice(2)] = value;
  }

  return { command, options };
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

function stableJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function isoWeekKey(date) {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const isoYear = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

function mondayForWeekKey(weekKey) {
  const match = /^([0-9]{4})-W([0-9]{2})$/.exec(weekKey);
  if (!match) {
    throw new Error(`Invalid ISO week key: ${weekKey}`);
  }

  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const januaryFourthDay = januaryFourth.getUTCDay() || 7;
  const monday = new Date(januaryFourth);
  monday.setUTCDate(januaryFourth.getUTCDate() - januaryFourthDay + 1 + (week - 1) * 7);

  if (isoWeekKey(monday) !== weekKey) {
    throw new Error(`ISO week does not exist: ${weekKey}`);
  }
  return monday;
}

function weekContext(requestedWeek) {
  const weekKey = requestedWeek || isoWeekKey(new Date());
  const monday = mondayForWeekKey(weekKey);
  const priorMonday = new Date(monday);
  priorMonday.setUTCDate(priorMonday.getUTCDate() - 7);
  return {
    weekKey,
    priorWeekKey: isoWeekKey(priorMonday),
    parentKey: `weekly-refresh:${weekKey}`,
    parentMarker: `<!-- agentic-refresh-parent:${weekKey} -->`,
  };
}

async function readQuests() {
  const text = await readFile(
    resolve(root, ".github/agentic-refresh/quests.json"),
    "utf8",
  );
  return JSON.parse(text);
}

function questLabel(quest) {
  return `quest/${quest.id}-${quest.slug}`;
}

function isOwnedPath(quest, repository, path) {
  if (
    typeof path !== "string" ||
    path.length === 0 ||
    path.startsWith("/") ||
    path.includes("\\") ||
    posix.normalize(path) !== path ||
    path.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    return false;
  }
  const patterns = quest.ownedPaths?.[repository] ?? [];
  return patterns.some((pattern) => {
    if (pattern.endsWith("/**")) {
      const directory = pattern.slice(0, -3);
      return path === directory || path.startsWith(`${directory}/`);
    }
    return path === pattern;
  });
}

function isAllowedSource(quest, url) {
  let candidate;
  try {
    candidate = new URL(url);
  } catch {
    return false;
  }

  return quest.officialSourcePrefixes.some((prefix) => {
    const allowed = new URL(prefix);
    const allowedPath = allowed.pathname.replace(/\/+$/, "");
    return (
      candidate.origin === allowed.origin &&
      (candidate.pathname === allowedPath ||
        candidate.pathname.startsWith(`${allowedPath}/`))
    );
  });
}

function externalPathAllowed(quest, repository, path) {
  return quest.externalReports.some(
    (report) =>
      report.repository === repository && report.observedPaths.includes(path),
  );
}

function requireString(errors, value, label, { allowEmpty = false, max = 8_000 } = {}) {
  if (
    typeof value !== "string" ||
    (!allowEmpty && value.trim().length === 0) ||
    value.length > max
  ) {
    errors.push(`${label} must be a ${allowEmpty ? "" : "non-empty "}string of at most ${max} characters`);
  }
}

function requireStringArray(errors, value, label, { maxItems = 50 } = {}) {
  if (!Array.isArray(value) || value.length > maxItems) {
    errors.push(`${label} must be an array with at most ${maxItems} items`);
    return;
  }
  value.forEach((item, index) =>
    requireString(errors, item, `${label}[${index}]`, { max: 2_000 }),
  );
  if (new Set(value).size !== value.length) {
    errors.push(`${label} must not contain duplicates`);
  }
}

function validateCoreReport(report, quest, expected) {
  const errors = [];
  if (report === null || typeof report !== "object" || Array.isArray(report)) {
    return ["report must be a JSON object"];
  }

  const unknownKeys = Object.keys(report).filter((key) => !coreKeys.includes(key));
  const missingKeys = coreKeys.filter((key) => !(key in report));
  if (unknownKeys.length > 0) {
    errors.push(`report has unknown fields: ${unknownKeys.join(", ")}`);
  }
  if (missingKeys.length > 0) {
    errors.push(`report is missing fields: ${missingKeys.join(", ")}`);
  }

  if (report.schemaVersion !== 1) {
    errors.push("schemaVersion must be 1");
  }
  if (report.weekKey !== expected.weekKey) {
    errors.push(`weekKey must be ${expected.weekKey}`);
  }
  if (report.priorWeekKey !== expected.priorWeekKey) {
    errors.push(`priorWeekKey must be ${expected.priorWeekKey}`);
  }
  if (report.questSlug !== quest.slug) {
    errors.push(`questSlug must be ${quest.slug}`);
  }
  if (!resultValues.includes(report.result)) {
    errors.push(`result must be one of ${resultValues.join(", ")}`);
  }
  if (!learnerImpactValues.includes(report.learnerImpact)) {
    errors.push(`learnerImpact must be one of ${learnerImpactValues.join(", ")}`);
  }

  requireString(errors, report.executiveSummary, "executiveSummary", { max: 2_000 });
  requireString(errors, report.currentQuestStatus, "currentQuestStatus", { max: 4_000 });
  requireString(errors, report.assetImpact, "assetImpact", {
    allowEmpty: true,
    max: 4_000,
  });
  requireStringArray(errors, report.validationPlan, "validationPlan");
  requireStringArray(errors, report.risks, "risks");
  requireStringArray(errors, report.humanDecisions, "humanDecisions");
  requireStringArray(errors, report.sourceFingerprints, "sourceFingerprints");
  requireStringArray(errors, report.priorFindingKeys, "priorFindingKeys");

  for (const [index, key] of (report.priorFindingKeys ?? []).entries()) {
    if (!/^finding:[0-9a-f]{64}$/.test(key)) {
      errors.push(`priorFindingKeys[${index}] must be a deterministic finding key`);
    }
  }

  if (!Array.isArray(report.officialSourceDeltas)) {
    errors.push("officialSourceDeltas must be an array");
  } else {
    report.officialSourceDeltas.forEach((delta, index) => {
      const prefix = `officialSourceDeltas[${index}]`;
      if (delta === null || typeof delta !== "object" || Array.isArray(delta)) {
        errors.push(`${prefix} must be an object`);
        return;
      }
      for (const field of [
        "fact",
        "lifecycle",
        "evidenceUrl",
        "evidenceLocation",
        "observedWording",
        "fingerprint",
      ]) {
        requireString(errors, delta[field], `${prefix}.${field}`, { max: 4_000 });
      }
      if (!lifecycleValues.includes(delta.lifecycle)) {
        errors.push(`${prefix}.lifecycle is not an allowed lifecycle value`);
      }
      if (!isAllowedSource(quest, delta.evidenceUrl ?? "")) {
        errors.push(`${prefix}.evidenceUrl is outside the quest source allowlist`);
      }
      if (!report.sourceFingerprints?.includes(delta.fingerprint)) {
        errors.push(`${prefix}.fingerprint must appear in sourceFingerprints`);
      }
    });
  }

  if (!Array.isArray(report.contentDrift)) {
    errors.push("contentDrift must be an array");
  } else {
    report.contentDrift.forEach((drift, index) => {
      const prefix = `contentDrift[${index}]`;
      if (drift === null || typeof drift !== "object" || Array.isArray(drift)) {
        errors.push(`${prefix} must be an object`);
        return;
      }
      requireString(errors, drift.path, `${prefix}.path`);
      requireString(errors, drift.section, `${prefix}.section`, { max: 1_000 });
      requireString(errors, drift.observation, `${prefix}.observation`, { max: 4_000 });
      if (
        !isOwnedPath(
          quest,
          "Azure-Samples/JavaScript-AI-Buildathon",
          drift.path ?? "",
        )
      ) {
        errors.push(`${prefix}.path is outside the quest ownership boundary`);
      }
    });
  }

  if (!Array.isArray(report.proposedChanges)) {
    errors.push("proposedChanges must be an array");
  } else {
    report.proposedChanges.forEach((change, index) => {
      const prefix = `proposedChanges[${index}]`;
      if (change === null || typeof change !== "object" || Array.isArray(change)) {
        errors.push(`${prefix} must be an object`);
        return;
      }
      requireString(errors, change.repository, `${prefix}.repository`);
      requireString(errors, change.path, `${prefix}.path`);
      requireString(errors, change.description, `${prefix}.description`, {
        max: 4_000,
      });
      if (
        change.repository !== "Azure-Samples/JavaScript-AI-Buildathon" ||
        !isOwnedPath(quest, change.repository, change.path ?? "")
      ) {
        errors.push(`${prefix} must target a Buildathon path owned by this quest`);
      }
    });
  }

  if (!Array.isArray(report.codeTourImpact)) {
    errors.push("codeTourImpact must be an array");
  } else {
    report.codeTourImpact.forEach((impact, index) => {
      const prefix = `codeTourImpact[${index}]`;
      if (impact === null || typeof impact !== "object" || Array.isArray(impact)) {
        errors.push(`${prefix} must be an object`);
        return;
      }
      for (const field of ["repository", "path", "mode", "handoff", "observation"]) {
        requireString(errors, impact[field], `${prefix}.${field}`, { max: 4_000 });
      }
      if (
        impact.mode !== "report-only" ||
        impact.handoff !== "manual-maintainer" ||
        !externalPathAllowed(quest, impact.repository ?? "", impact.path ?? "")
      ) {
        errors.push(`${prefix} must preserve an exact report-only CodeTour handoff`);
      }
    });
  }

  if (report.result === "material-change") {
    if (report.learnerImpact === "none") {
      errors.push("material-change must declare high, medium, or low learnerImpact");
    }
    if ((report.proposedChanges ?? []).length === 0) {
      errors.push("material-change must include at least one proposed change");
    }
    if (
      (report.officialSourceDeltas ?? []).length === 0 &&
      (report.contentDrift ?? []).length === 0
    ) {
      errors.push("material-change must include official evidence or content drift");
    }
    if (report.blockedReason !== null) {
      errors.push("material-change must set blockedReason to null");
    }
  } else if (report.result === "no-material-change") {
    if ((report.proposedChanges ?? []).length !== 0) {
      errors.push("no-material-change must not propose changes");
    }
    if (report.blockedReason !== null) {
      errors.push("no-material-change must set blockedReason to null");
    }
  } else if (report.result === "blocked") {
    requireString(errors, report.blockedReason, "blockedReason", { max: 2_000 });
    if ((report.proposedChanges ?? []).length !== 0) {
      errors.push("blocked reports must not propose changes");
    }
  }

  if (
    report.result !== "blocked" &&
    (report.sourceFingerprints ?? []).length === 0
  ) {
    errors.push("completed reports must include at least one source fingerprint");
  }

  if (Buffer.byteLength(JSON.stringify(report), "utf8") > 262_144) {
    errors.push("report exceeds the 256 KiB limit");
  }
  return errors;
}

function findingKeys(report) {
  const findings = [
    ...report.officialSourceDeltas.map((delta) => ({
      type: "official-source",
      evidenceUrl: delta.evidenceUrl,
      evidenceLocation: delta.evidenceLocation,
      observedWording: delta.observedWording,
    })),
    ...report.contentDrift.map((drift) => ({
      type: "content-drift",
      path: drift.path,
      section: drift.section,
      observation: drift.observation,
    })),
    ...report.codeTourImpact.map((impact) => ({
      type: "codetour",
      repository: impact.repository,
      path: impact.path,
      observation: impact.observation,
    })),
  ];
  return uniqueSorted(
    findings.map((finding) => `finding:${sha256({
      questSlug: report.questSlug,
      ...finding,
    })}`),
  );
}

function escapeTable(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function renderList(values) {
  return values.length > 0 ? values.map((value) => `- ${value}`).join("\n") : "- None.";
}

function renderDeltaTable(deltas) {
  if (deltas.length === 0) {
    return "No official-source delta was recorded.";
  }
  return [
    "| Fact | Lifecycle | Evidence | Location | Fingerprint |",
    "|---|---|---|---|---|",
    ...deltas.map(
      (delta) =>
        `| ${escapeTable(delta.fact)} | ${escapeTable(delta.lifecycle)} | ${escapeTable(delta.evidenceUrl)} | ${escapeTable(delta.evidenceLocation)} | ${escapeTable(delta.fingerprint)} |`,
    ),
  ].join("\n");
}

function buildChildIssuePreview(report, quest, deduplication) {
  if (report.result !== "material-change") {
    return null;
  }

  const manifest = {
    version: 1,
    weekKey: report.weekKey,
    priorWeekKey: report.priorWeekKey,
    questSlug: quest.slug,
    result: report.result,
    parentKey: deduplication.parentKey,
    childKey: deduplication.childKey,
    sourceFingerprints: report.sourceFingerprints,
    findingKeys: deduplication.findingKeys,
    priorFindingKeys: report.priorFindingKeys,
  };
  const body = [
    deduplication.childMarker,
    `<!-- agentic-refresh-manifest:${stableJson(manifest)} -->`,
    "",
    "### Executive summary",
    report.executiveSummary,
    "",
    "### Current quest status",
    report.currentQuestStatus,
    "",
    "### Official-source delta",
    renderDeltaTable(report.officialSourceDeltas),
    "",
    "### Learner impact",
    report.learnerImpact,
    "",
    "### Current-content drift",
    report.contentDrift.length > 0
      ? report.contentDrift
          .map(
            (drift) =>
              `- \`${drift.path}\` — **${drift.section}**: ${drift.observation}`,
          )
          .join("\n")
      : "- None.",
    "",
    "### Proposed changes",
    report.proposedChanges
      .map(
        (change) =>
          `- \`${change.repository}:${change.path}\` — ${change.description}`,
      )
      .join("\n"),
    "",
    "### Asset impact",
    report.assetImpact || "None.",
    "",
    "### CodeTour impact",
    report.codeTourImpact.length > 0
      ? report.codeTourImpact
          .map(
            (impact) =>
              `- \`${impact.repository}:${impact.path}\` — ${impact.observation} (${impact.mode}, ${impact.handoff})`,
          )
          .join("\n")
      : "- None.",
    "",
    "### Stack map",
    `- \`refresh/${report.weekKey}/${quest.slug}/01-core\``,
    `- \`refresh/${report.weekKey}/${quest.slug}/02-docs\` when documentation synchronization is required`,
    "",
    "### Validation plan",
    renderList(report.validationPlan),
    "",
    "### Risks and uncertainty",
    renderList(report.risks),
    "",
    "### Human decisions",
    renderList(report.humanDecisions),
    "",
    "### Approval",
    "Julia may approve this exact plan by commenting `/approve-refresh`.",
  ].join("\n");

  return {
    title: `[Refresh plan][${report.weekKey}] ${quest.title}`,
    labels: ["refresh/plan", "refresh/awaiting-approval", questLabel(quest)],
    body,
  };
}

function addDerivedFields(report, quest) {
  const normalizedReport = {
    ...report,
    sourceFingerprints: uniqueSorted(report.sourceFingerprints),
    priorFindingKeys: uniqueSorted(report.priorFindingKeys),
  };
  const currentFindingKeys = findingKeys(normalizedReport);
  const deduplication = {
    parentKey: `weekly-refresh:${normalizedReport.weekKey}`,
    childKey: `weekly-refresh:${normalizedReport.weekKey}:${quest.slug}`,
    parentMarker: `<!-- agentic-refresh-parent:${normalizedReport.weekKey} -->`,
    childMarker: `<!-- agentic-refresh-child:${normalizedReport.weekKey}:${quest.slug} -->`,
    findingKeys: currentFindingKeys,
    carriedFindingKeys: currentFindingKeys.filter((key) =>
      normalizedReport.priorFindingKeys.includes(key),
    ),
  };

  return {
    ...normalizedReport,
    deduplication,
    childIssuePreview: buildChildIssuePreview(
      normalizedReport,
      quest,
      deduplication,
    ),
  };
}

function blockedCoreReport(quest, expected, reason) {
  return {
    schemaVersion: 1,
    weekKey: expected.weekKey,
    priorWeekKey: expected.priorWeekKey,
    questSlug: quest.slug,
    result: "blocked",
    executiveSummary: "The discovery run did not produce a valid structured report.",
    currentQuestStatus: "The quest status could not be assessed safely.",
    learnerImpact: "none",
    officialSourceDeltas: [],
    contentDrift: [],
    proposedChanges: [],
    assetImpact: "",
    codeTourImpact: [],
    validationPlan: [],
    risks: ["The weekly digest has incomplete evidence for this quest."],
    humanDecisions: ["Review the blocked reason before retrying discovery."],
    sourceFingerprints: [],
    priorFindingKeys: [],
    blockedReason: reason.slice(0, 2_000),
  };
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function materialize(options) {
  const quests = await readQuests();
  const quest = quests.quests.find(({ slug }) => slug === options.quest);
  if (!quest) {
    throw new Error(`Unknown quest slug: ${options.quest}`);
  }
  const expected = {
    weekKey: options.week,
    priorWeekKey: options["prior-week"],
  };
  const context = weekContext(expected.weekKey);
  if (expected.priorWeekKey !== context.priorWeekKey) {
    throw new Error(
      `prior week must be ${context.priorWeekKey} for ${expected.weekKey}`,
    );
  }

  let artifact;
  let failure;
  try {
    const agentOutput = JSON.parse(await readFile(options["agent-output"], "utf8"));
    const items = (agentOutput.items ?? []).filter(
      ({ type }) => type === "emit_weekly_report",
    );
    if (items.length !== 1) {
      throw new Error(`Expected one emit_weekly_report item, received ${items.length}`);
    }
    const item = items[0];
    const report = JSON.parse(item.report_json);
    if (item.result !== report.result) {
      throw new Error("Safe-output result does not match report_json.result");
    }
    const errors = validateCoreReport(report, quest, expected);
    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
    artifact = addDerivedFields(report, quest);
  } catch (error) {
    failure = error;
    artifact = addDerivedFields(
      blockedCoreReport(quest, expected, `Report materialization failed: ${error.message}`),
      quest,
    );
  }

  await writeJson(resolve(options.output), artifact);
  if (failure) {
    throw failure;
  }
}

function validateArtifact(report, quest, expected) {
  const core = Object.fromEntries(coreKeys.map((key) => [key, report[key]]));
  const errors = validateCoreReport(core, quest, expected);
  const derived = addDerivedFields(core, quest);
  if (stableJson(report.deduplication) !== stableJson(derived.deduplication)) {
    errors.push("deduplication fields do not match deterministic values");
  }
  if (stableJson(report.childIssuePreview) !== stableJson(derived.childIssuePreview)) {
    errors.push("childIssuePreview does not match the deterministic preview");
  }
  return errors;
}

function buildParentIssuePreview(reports, weekKey, priorWeekKey) {
  const parentMarker = `<!-- agentic-refresh-parent:${weekKey} -->`;
  const childKeys = reports
    .filter(({ result }) => result === "material-change")
    .map(({ deduplication }) => deduplication.childKey);
  const manifest = {
    version: 1,
    weekKey,
    priorWeekKey,
    parentKey: `weekly-refresh:${weekKey}`,
    childKeys,
    outcomes: Object.fromEntries(
      reports.map((report) => [report.questSlug, report.result]),
    ),
  };
  const table = [
    "| Quest | Result | Learner impact | Child preview |",
    "|---|---|---|---|",
    ...reports.map((report) => {
      const child =
        report.result === "material-change"
          ? `\`children/${report.questSlug}.md\``
          : "None";
      return `| ${report.questSlug} | ${report.result} | ${report.learnerImpact} | ${child} |`;
    }),
  ].join("\n");
  const blocked = reports.filter(({ result }) => result === "blocked");
  const unchanged = reports.filter(({ result }) => result === "no-material-change");
  const body = [
    parentMarker,
    `<!-- agentic-refresh-manifest:${stableJson(manifest)} -->`,
    "",
    "### Weekly summary",
    table,
    "",
    "### Affected quests",
    renderList(
      reports
        .filter(({ result }) => result === "material-change")
        .map(
          (report) =>
            `${report.questSlug}: ${report.executiveSummary} (${report.deduplication.childKey})`,
        ),
    ),
    "",
    "### No material change",
    renderList(
      unchanged.map(
        (report) => `${report.questSlug}: ${report.executiveSummary}`,
      ),
    ),
    "",
    "### Blocked scopes",
    renderList(
      blocked.map(
        (report) => `${report.questSlug}: ${report.blockedReason}`,
      ),
    ),
    "",
    "### Run mode",
    "Phase 2A staged preview only. No issue, branch, pull request, comment, schedule, or content write is enabled.",
  ].join("\n");

  return {
    title: `[Weekly refresh][${weekKey}] Quest content digest`,
    labels: ["refresh/plan"],
    body,
  };
}

async function digest(options) {
  const quests = await readQuests();
  const expected = {
    weekKey: options.week,
    priorWeekKey: options["prior-week"],
  };
  const context = weekContext(expected.weekKey);
  if (expected.priorWeekKey !== context.priorWeekKey) {
    throw new Error(
      `prior week must be ${context.priorWeekKey} for ${expected.weekKey}`,
    );
  }
  const reports = [];
  const inputErrors = [];

  for (const quest of quests.quests) {
    const reportPath = resolve(options["reports-dir"], `${quest.slug}.json`);
    try {
      const report = JSON.parse(await readFile(reportPath, "utf8"));
      const errors = validateArtifact(report, quest, expected);
      if (errors.length > 0) {
        throw new Error(errors.join("; "));
      }
      reports.push(report);
    } catch (error) {
      inputErrors.push(`${quest.slug}: ${error.message}`);
      reports.push(
        addDerivedFields(
          blockedCoreReport(
            quest,
            expected,
            `Quest artifact unavailable or invalid: ${error.message}`,
          ),
          quest,
        ),
      );
    }
  }

  const outputDirectory = resolve(options["output-dir"]);
  const parentIssuePreview = buildParentIssuePreview(
    reports,
    expected.weekKey,
    expected.priorWeekKey,
  );
  const digestValue = {
    schemaVersion: 1,
    weekKey: expected.weekKey,
    priorWeekKey: expected.priorWeekKey,
    parentKey: `weekly-refresh:${expected.weekKey}`,
    results: reports.map(({ questSlug, result }) => ({ questSlug, result })),
    inputErrors,
    parentIssuePreview,
    reports,
  };

  await writeJson(resolve(outputDirectory, "digest.json"), digestValue);
  await mkdir(resolve(outputDirectory, "children"), { recursive: true });
  await writeFile(
    resolve(outputDirectory, "parent-issue.md"),
    `# ${parentIssuePreview.title}\n\nLabels: ${parentIssuePreview.labels.join(", ")}\n\n${parentIssuePreview.body}\n`,
  );
  for (const report of reports) {
    if (!report.childIssuePreview) {
      continue;
    }
    await writeFile(
      resolve(outputDirectory, "children", `${report.questSlug}.md`),
      `# ${report.childIssuePreview.title}\n\nLabels: ${report.childIssuePreview.labels.join(", ")}\n\n${report.childIssuePreview.body}\n`,
    );
  }
  return digestValue;
}

function sampleOwnedPath(quest) {
  const pattern =
    quest.ownedPaths["Azure-Samples/JavaScript-AI-Buildathon"][0];
  return pattern.endsWith("/**")
    ? `${pattern.slice(0, -3)}/README.md`
    : pattern;
}

function sampleReport(quest, expected, result) {
  const material = result === "material-change";
  const blocked = result === "blocked";
  const path = sampleOwnedPath(quest);
  return {
    schemaVersion: 1,
    weekKey: expected.weekKey,
    priorWeekKey: expected.priorWeekKey,
    questSlug: quest.slug,
    result,
    executiveSummary: `${quest.title} ${result} self-test result.`,
    currentQuestStatus: blocked ? "Status unavailable." : "Current guidance inspected.",
    learnerImpact: material ? "medium" : "none",
    officialSourceDeltas: blocked
      ? []
      : [
          {
            fact: "Self-test fact",
            lifecycle: "Not stated by allowed sources",
            evidenceUrl: quest.officialSourcePrefixes[0],
            evidenceLocation: "Self-test",
            observedWording: "Self-test wording",
            fingerprint: `content:${quest.slug}`,
          },
        ],
    contentDrift: material
      ? [{ path, section: "Self-test", observation: "Self-test drift" }]
      : [],
    proposedChanges: material
      ? [
          {
            repository: "Azure-Samples/JavaScript-AI-Buildathon",
            path,
            description: "Apply the self-test change.",
          },
        ]
      : [],
    assetImpact: "",
    codeTourImpact: [],
    validationPlan: material ? ["Run self-test validation."] : [],
    risks: blocked ? ["Self-test block."] : [],
    humanDecisions: [],
    sourceFingerprints: blocked ? [] : [`content:${quest.slug}`],
    priorFindingKeys: [],
    blockedReason: blocked ? "Self-test blocked reason." : null,
  };
}

async function selfTest() {
  assert.equal(weekContext("2021-W01").priorWeekKey, "2020-W53");
  assert.equal(weekContext("2025-W01").priorWeekKey, "2024-W52");
  assert.throws(() => weekContext("2021-W53"), /does not exist/);

  const quests = await readQuests();
  const expected = { weekKey: "2026-W30", priorWeekKey: "2026-W29" };
  const temporaryDirectory = await mkdtemp(
    resolve(tmpdir(), "weekly-refresh-self-test-"),
  );
  try {
    const materialCore = sampleReport(
      quests.quests[0],
      expected,
      "material-change",
    );
    materialCore.sourceFingerprints = [
      "content:z-last",
      materialCore.sourceFingerprints[0],
    ];
    materialCore.priorFindingKeys = [
      `finding:${"b".repeat(64)}`,
      `finding:${"a".repeat(64)}`,
    ];
    const agentOutputPath = resolve(temporaryDirectory, "agent-output.json");
    const materializedPath = resolve(
      temporaryDirectory,
      "materialized",
      `${quests.quests[0].slug}.json`,
    );
    await writeJson(agentOutputPath, {
      items: [
        {
          type: "emit_weekly_report",
          result: materialCore.result,
          report_json: JSON.stringify(materialCore),
        },
      ],
    });
    await materialize({
      "agent-output": agentOutputPath,
      output: materializedPath,
      week: expected.weekKey,
      "prior-week": expected.priorWeekKey,
      quest: quests.quests[0].slug,
    });
    const materialized = JSON.parse(await readFile(materializedPath, "utf8"));
    assert.equal(materialized.result, "material-change");
    assert.ok(materialized.childIssuePreview);
    assert.deepEqual(
      validateArtifact(materialized, quests.quests[0], expected),
      [],
    );

    const adjacentSource = structuredClone(materialCore);
    adjacentSource.officialSourceDeltas[0].evidenceUrl =
      `${quests.quests[0].officialSourcePrefixes[1]}-malicious`;
    assert.ok(
      validateCoreReport(adjacentSource, quests.quests[0], expected).some(
        (error) => error.includes("outside the quest source allowlist"),
      ),
    );
    const traversalPath = structuredClone(materialCore);
    traversalPath.contentDrift[0].path =
      "01-Local-AI-Development/../.github/workflows/example.yml";
    assert.ok(
      validateCoreReport(traversalPath, quests.quests[0], expected).some(
        (error) => error.includes("outside the quest ownership boundary"),
      ),
    );
    const missingOutputPath = resolve(
      temporaryDirectory,
      "missing-agent-output.json",
    );
    const blockedMaterializedPath = resolve(
      temporaryDirectory,
      "materialized",
      "blocked.json",
    );
    await writeJson(missingOutputPath, { items: [] });
    await assert.rejects(
      materialize({
        "agent-output": missingOutputPath,
        output: blockedMaterializedPath,
        week: expected.weekKey,
        "prior-week": expected.priorWeekKey,
        quest: quests.quests[0].slug,
      }),
      /Expected one emit_weekly_report item/,
    );
    assert.equal(
      JSON.parse(await readFile(blockedMaterializedPath, "utf8")).result,
      "blocked",
    );

    for (const [index, quest] of quests.quests.entries()) {
      const result =
        index === 0
          ? "material-change"
          : index === 1
            ? "blocked"
            : "no-material-change";
      const core = sampleReport(quest, expected, result);
      assert.deepEqual(validateCoreReport(core, quest, expected), []);
      await writeJson(
        resolve(temporaryDirectory, "reports", `${quest.slug}.json`),
        addDerivedFields(core, quest),
      );
    }

    const digestValue = await digest({
      week: expected.weekKey,
      "prior-week": expected.priorWeekKey,
      "reports-dir": resolve(temporaryDirectory, "reports"),
      "output-dir": resolve(temporaryDirectory, "preview"),
    });
    assert.equal(digestValue.results.length, 5);
    assert.deepEqual(digestValue.inputErrors, []);
    assert.equal(
      digestValue.reports.filter(({ childIssuePreview }) => childIssuePreview)
        .length,
      1,
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
  console.log("Weekly refresh report self-test passed.");
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2));
  if (command === "context") {
    const context = weekContext(options.week);
    if (options["github-output"]) {
      await writeFile(
        resolve(options["github-output"]),
        `week_key=${context.weekKey}\nprior_week_key=${context.priorWeekKey}\nparent_key=${context.parentKey}\n`,
        { flag: "a" },
      );
    }
    console.log(JSON.stringify(context));
  } else if (command === "materialize") {
    for (const key of ["agent-output", "output", "week", "prior-week", "quest"]) {
      if (!options[key]) {
        throw new Error(`materialize requires --${key}`);
      }
    }
    await materialize(options);
  } else if (command === "digest") {
    for (const key of [
      "reports-dir",
      "output-dir",
      "week",
      "prior-week",
    ]) {
      if (!options[key]) {
        throw new Error(`digest requires --${key}`);
      }
    }
    await digest(options);
  } else if (command === "validate") {
    for (const key of ["report", "week", "prior-week", "quest"]) {
      if (!options[key]) {
        throw new Error(`validate requires --${key}`);
      }
    }
    const quests = await readQuests();
    const quest = quests.quests.find(({ slug }) => slug === options.quest);
    if (!quest) {
      throw new Error(`Unknown quest slug: ${options.quest}`);
    }
    const report = JSON.parse(await readFile(resolve(options.report), "utf8"));
    const errors = validateArtifact(report, quest, {
      weekKey: options.week,
      priorWeekKey: options["prior-week"],
    });
    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
    console.log(`Validated ${options.report}`);
  } else if (command === "self-test") {
    await selfTest();
  } else {
    throw new Error(
      "Usage: weekly-refresh-report.mjs context|materialize|digest|validate|self-test",
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
