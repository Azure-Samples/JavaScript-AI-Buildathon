import { access, readdir, readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([
  ".git",
  ".playwright-mcp",
  "node_modules",
  "site",
]);
const markdownFiles = [];
const failures = [];

async function collectMarkdownFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await collectMarkdownFiles(entryPath);
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      markdownFiles.push(entryPath);
    }
  }
}

function stripCodeFences(content) {
  let insideFence = false;

  return content
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        insideFence = !insideFence;
        return "";
      }
      return insideFence ? "" : line;
    })
    .join("\n");
}

function normalizeTarget(rawTarget) {
  let target = rawTarget.trim();

  if (target.startsWith("<") && target.endsWith(">")) {
    target = target.slice(1, -1);
  }

  target = target.replace(/\s+["'][^"']*["']\s*$/, "");
  return target;
}

function isExternalOrTemplate(target) {
  return (
    target.length === 0 ||
    target.startsWith("//") ||
    target.startsWith("{{") ||
    target.startsWith("${{") ||
    /^[a-z][a-z0-9+.-]*:/i.test(target)
  );
}

async function resolveLocalTarget(sourceFile, rawPath, displayTarget) {
  if (!rawPath) {
    return sourceFile;
  }

  let decodedTarget;
  try {
    decodedTarget = decodeURIComponent(rawPath);
  } catch {
    failures.push(
      `${relative(root, sourceFile)} contains an invalid encoded link: ${displayTarget}`,
    );
    return sourceFile;
  }

  const candidate = decodedTarget.startsWith("/")
    ? resolve(root, `.${decodedTarget}`)
    : resolve(dirname(sourceFile), decodedTarget);
  const relativeCandidate = relative(root, candidate);

  if (
    relativeCandidate === ".." ||
    relativeCandidate.startsWith(`..${sep}`)
  ) {
    failures.push(
      `${relative(root, sourceFile)} links outside the repository: ${displayTarget}`,
    );
    return sourceFile;
  }

  const candidates =
    extname(candidate) === ""
      ? [`${candidate}.md`, resolve(candidate, "index.md"), candidate]
      : [candidate];

  for (const candidatePath of candidates) {
    try {
      await access(candidatePath);
      return candidatePath;
    } catch {
      // Try the next MkDocs-compatible target shape.
    }
  }

  return null;
}

async function targetExists(sourceFile, rawTarget, documents) {
  const target = normalizeTarget(rawTarget);
  if (isExternalOrTemplate(target)) {
    return true;
  }

  const hashIndex = target.indexOf("#");
  const pathAndQuery = hashIndex === -1 ? target : target.slice(0, hashIndex);
  const rawFragment = hashIndex === -1 ? null : target.slice(hashIndex + 1);
  const rawPath = pathAndQuery.split("?", 1)[0];
  const targetFile = await resolveLocalTarget(sourceFile, rawPath, target);

  if (!targetFile) {
    return false;
  }

  if (rawFragment === null || rawFragment.length === 0) {
    return true;
  }

  let fragment;
  try {
    fragment = decodeURIComponent(rawFragment);
  } catch {
    failures.push(
      `${relative(root, sourceFile)} contains an invalid encoded fragment: ${target}`,
    );
    return true;
  }

  if (extname(targetFile).toLowerCase() !== ".md") {
    return true;
  }

  const anchors = documents.get(targetFile)?.anchors;
  if (!anchors?.has(fragment)) {
    failures.push(
      `${relative(root, sourceFile)} has a missing local fragment: ${target}`,
    );
    return true;
  }

  return true;
}

function headingAnchor(heading) {
  const explicitAnchor = heading.match(
    /\{[^}]*#([A-Za-z][\w:.-]*)[^}]*\}\s*$/,
  );
  if (explicitAnchor) {
    return explicitAnchor[1];
  }

  return heading
    .replace(/\{[^}]*\}\s*$/, "")
    .replace(/!\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

await collectMarkdownFiles(root);

const documents = new Map();

for (const filePath of markdownFiles.sort()) {
  const content = stripCodeFences(await readFile(filePath, "utf8"));
  const anchors = new Set();
  const headingPattern = /^#{1,6}\s+(.+?)\s*#*\s*$/gm;
  const htmlAnchorPattern = /\b(?:id|name)=["']([^"']+)["']/gi;

  for (const match of content.matchAll(headingPattern)) {
    const anchor = headingAnchor(match[1]);
    if (!anchor) {
      continue;
    }
    if (anchors.has(anchor)) {
      failures.push(
        `${relative(root, filePath)} has a duplicate heading anchor: #${anchor}`,
      );
    }
    anchors.add(anchor);
  }

  for (const match of content.matchAll(htmlAnchorPattern)) {
    if (anchors.has(match[1])) {
      failures.push(
        `${relative(root, filePath)} has a duplicate explicit anchor: #${match[1]}`,
      );
    }
    anchors.add(match[1]);
  }

  documents.set(filePath, { anchors, content });
}

for (const [filePath, document] of documents) {
  const targets = [];
  const inlineLinkPattern = /!?\[[^\]]*]\(([^)\n]+)\)/g;
  const referenceLinkPattern = /^\s*\[[^\]]+]:\s*(\S+)/gm;
  const htmlLinkPattern = /\b(?:href|src)=["']([^"']+)["']/gi;

  for (const pattern of [
    inlineLinkPattern,
    referenceLinkPattern,
    htmlLinkPattern,
  ]) {
    for (const match of document.content.matchAll(pattern)) {
      targets.push(match[1]);
    }
  }

  for (const target of targets) {
    if (!(await targetExists(filePath, target, documents))) {
      failures.push(
        `${relative(root, filePath)} has a missing local target: ${normalizeTarget(target)}`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Local content link validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Validated local links in ${markdownFiles.length} Markdown files.`);
}
