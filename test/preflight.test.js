import test from "node:test";
import assert from "node:assert/strict";
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
  const result = evaluatePreflight(
    [{ path: "config.js", content: 'api_key = "1234567890abcdef"' }],
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
