import test from "node:test";
import assert from "node:assert/strict";
import { validatePrivacyBoundary, validateWorkContract } from "../src/protocol.js";
import { detectContractConflict } from "../src/conflict.js";
import { SemaLaneCoordinator } from "../src/coordinator.js";

function contract(overrides = {}) {
  return {
    id: "TASK-1",
    agentId: "agent-a",
    task: "update auth endpoint",
    expectedOutcome: "endpoint rejects invalid tokens",
    resources: ["api:auth"],
    paths: ["src/auth"],
    contracts: ["public-api:auth-v2"],
    constraints: [],
    ...overrides
  };
}

test("privacy boundary rejects chain-of-thought payloads", () => {
  assert.throws(
    () => validatePrivacyBoundary({ evidence: { chainOfThought: "secret" } }),
    /private reasoning fields are forbidden/
  );
});

test("work contracts canonicalize resources and paths", () => {
  const value = validateWorkContract(contract({ resources: ["B", "a", "B"] }));
  assert.deepEqual(value.resources, ["B", "a"]);
});

test("semantic conflicts are detected even without file overlap", () => {
  const a = contract({ paths: ["src/auth"], resources: [], contracts: ["public-api:auth-v2"] });
  const b = contract({
    id: "TASK-2",
    agentId: "agent-b",
    paths: ["docs/client"],
    resources: [],
    contracts: ["public-api:auth-v2"]
  });
  const result = detectContractConflict(a, b);
  assert.equal(result.conflict, true);
  assert.equal(result.reasons[0].type, "semantic-contract");
});

test("coordinator blocks a conflicting concurrent contract", () => {
  const semalane = new SemaLaneCoordinator();
  const first = semalane.registerContract(contract());
  const second = semalane.registerContract(contract({ id: "TASK-2", agentId: "agent-b" }));
  assert.equal(first.state, "active");
  assert.equal(second.state, "blocked");
  assert.equal(second.conflicts[0].with, "TASK-1");
});

test("evidence cannot target an unknown contract", () => {
  const semalane = new SemaLaneCoordinator();
  assert.throws(() => semalane.attachEvidence({
    id: "E-1",
    contractId: "missing",
    kind: "test",
    summary: "all good"
  }), /unknown contract/);
});
