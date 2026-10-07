import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { evaluatePreflight } from "../src/preflight.js";

test("contest privacy preflight fails closed when protected-term policy is absent", () => {
  const result = evaluatePreflight(
    [{ path: "README.md", content: "public contest text" }],
    { protectedTerms: [], requireProtectedTerms: true }
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.findings, [
    { path: "<policy>", type: "policy", rule: "protected-terms-required" }
  ]);
});

test("generic secret checks remain active when protected-term policy is configured", () => {
  const keyName = ["api", "key"].join("_");
  const fakeValue = ["12345678", "90abcdef"].join("");
  const result = evaluatePreflight(
    [{ path: "config.js", content: `${keyName} = "${fakeValue}"` }],
    { protectedTerms: ["operator-only-term"], requireProtectedTerms: true }
  );

  assert.equal(result.ok, false);
  assert.equal(result.findings.some((finding) => finding.type === "secret" && finding.rule === "generic-api-key"), true);
  assert.equal(result.findings.some((finding) => finding.rule === "protected-terms-required"), false);
});

test("configured protected terms are still detected", () => {
  const result = evaluatePreflight(
    [{ path: "notes.md", content: "contains operator-only-term here" }],
    { protectedTerms: ["operator-only-term"], requireProtectedTerms: true }
  );

  assert.equal(result.ok, false);
  assert.equal(result.findings.some((finding) => finding.type === "protected-term"), true);
  assert.equal(result.findings.some((finding) => finding.rule === "protected-terms-required"), false);
});


test("public preflight policy can validate without private protected terms", () => {
  const result = evaluatePreflight(
    [{ path: "README.md", content: "public contest text" }],
    { protectedTerms: [], requireProtectedTerms: false }
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("public preflight policy still rejects generic secrets", () => {
  const keyName = ["api", "key"].join("_");
  const fakeValue = ["abcdefgh", "12345678"].join("");
  const result = evaluatePreflight(
    [{ path: "config.js", content: `${keyName} = "${fakeValue}"` }],
    { protectedTerms: [], requireProtectedTerms: false }
  );

  assert.equal(result.ok, false);
  assert.equal(result.findings.some((finding) => finding.type === "secret" && finding.rule === "generic-api-key"), true);
  assert.equal(result.findings.some((finding) => finding.rule === "protected-terms-required"), false);
});


test("public preflight CLI succeeds without private policy", () => {
  const env = { ...process.env };
  delete env.SEMALANE_PROTECTED_TERMS;
  const result = spawnSync(process.execPath, ["scripts/preflight.mjs", "--public"], {
    cwd: process.cwd(),
    env,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, true);
  assert.equal(output.policyMode, "public-synthetic");
  assert.equal(output.protectedTermsConfigured, 0);
});

test("private contest preflight CLI still fails closed without private policy", () => {
  const env = { ...process.env };
  delete env.SEMALANE_PROTECTED_TERMS;
  const result = spawnSync(process.execPath, ["scripts/preflight.mjs"], {
    cwd: process.cwd(),
    env,
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stderr);
  assert.equal(output.ok, false);
  assert.equal(output.findings.some((finding) => finding.rule === "protected-terms-required"), true);
});
