import test from "node:test";
import assert from "node:assert/strict";
import { authorizeAgentAction, validateCapabilitySeparation } from "../src/authority.js";
import { SemaLaneCoordinator } from "../src/coordinator.js";

function agent(overrides = {}) {
  return {
    id: "worker-a",
    role: "worker",
    state: "active",
    capabilities: ["read:project", "write:task-fork"],
    ...overrides
  };
}

test("capability sets reject writer plus reviewer authority", () => {
  assert.throws(
    () => validateCapabilitySeparation(["write:task-fork", "review:evidence"]),
    /separation of powers/
  );
});

test("capability sets reject writer plus promotion authority", () => {
  assert.throws(
    () => validateCapabilitySeparation(["write:task-fork", "promote:composition"]),
    /separation of powers/
  );
});

test("agent action requires an explicit capability", () => {
  assert.throws(
    () => authorizeAgentAction(agent(), "promote:composition"),
    /missing capability/
  );
});

test("an author cannot review their own contract", () => {
  assert.throws(
    () => authorizeAgentAction(
      agent({ capabilities: ["review:evidence"] }),
      "review:evidence",
      { contract: { id: "TASK-1", agentId: "worker-a" } }
    ),
    /cannot review its own work/
  );
});

test("an author cannot promote their own contract", () => {
  assert.throws(
    () => authorizeAgentAction(
      agent({ capabilities: ["promote:composition"] }),
      "promote:composition",
      { contracts: [{ id: "TASK-1", agentId: "worker-a" }] }
    ),
    /cannot promote its own work/
  );
});

test("independent reviewer can attach review evidence through agent boundary", () => {
  const semalane = new SemaLaneCoordinator();
  semalane.registerContract({
    id: "TASK-1", agentId: "worker-a", task: "change auth", expectedOutcome: "auth works",
    resources: [], paths: ["src/auth"], contracts: [], constraints: []
  });
  semalane.registerResidentAgent({ id: "worker-a", role: "worker", capabilities: ["read:project", "write:task-fork"] });
  semalane.registerResidentAgent({ id: "reviewer-a", role: "reviewer", capabilities: ["read:project", "review:evidence"] });
  semalane.resumeAgent("reviewer-a", { verified: ["TASK-1 commit inspected"] });
  const evidence = semalane.agentAttachEvidence("reviewer-a", {
    id: "REVIEW-1", contractId: "TASK-1", kind: "review", outcome: "approved",
    reviewerId: "reviewer-a", summary: "observable behavior approved"
  });
  assert.equal(evidence.reviewerId, "reviewer-a");
});

test("worker cannot use agent boundary to promote composition", () => {
  const semalane = new SemaLaneCoordinator();
  semalane.registerContract({
    id: "TASK-1", agentId: "worker-a", task: "change auth", expectedOutcome: "auth works",
    resources: [], paths: ["src/auth"], contracts: [], constraints: []
  });
  semalane.registerResidentAgent({ id: "worker-a", role: "worker", capabilities: ["read:project", "write:task-fork"] });
  semalane.resumeAgent("worker-a", { verified: ["TASK-1 state inspected"] });
  assert.throws(() => semalane.agentMarkMerged("worker-a", ["TASK-1"]), /missing capability/);
});
