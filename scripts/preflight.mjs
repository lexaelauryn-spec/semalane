import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluatePreflight } from "../src/preflight.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirs = new Set([".git", ".cloudflare", ".tools", "node_modules", ".wrangler"]);
const ignoredFiles = new Set(["docs/CHECKPOINT.md"]);
const protectedTerms = (process.env.SEMALANE_PROTECTED_TERMS ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(root, absolute).replaceAll("\\", "/");
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (!ignoredFiles.has(relative) && !relative.includes(".bak.")) files.push({ absolute, relative });
  }
  return files;
}

const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
const findings = [];

if (!["Apache-2.0", "MIT", "BSD-2-Clause", "BSD-3-Clause"].includes(packageJson.license)) {
  findings.push({ type: "license", rule: "permissive-license-required", path: "package.json" });
}

const files = [];
for (const file of await walk(root)) {
  if (!/\.(?:js|mjs|json|jsonc|md|txt|html|css)$/i.test(file.relative) && !["README.md",".gitignore"].includes(file.relative)) continue;
  files.push({ path: file.relative, content: await fs.readFile(file.absolute, "utf8") });
}

const readme = files.find((file) => file.path === "README.md");
if (readme?.content.includes("\\n- ")) {
  findings.push({ type: "readme-format", rule: "literal-backslash-n-list-artifact", path: "README.md" });
}

findings.push(...evaluatePreflight(files, { protectedTerms }).findings);

if (findings.length) {
  console.error(JSON.stringify({ ok: false, findings }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    ok: true,
    scannedFiles: files.length,
    license: packageJson.license,
    protectedTermsConfigured: protectedTerms.length
  }, null, 2));
}
