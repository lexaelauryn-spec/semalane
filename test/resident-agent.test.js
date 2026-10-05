import test from "node:test";
import assert from "node:assert/strict";
import { idleResidentAgent, resumeResidentAgent, validateResidentAgent } from "../src/resident-agent.js";

function resident(overrides = {}) {
  return validateResidentAgent({
    id: "auth-worker",
    role: "worker",
    capabilities: ["write:task-fork", "read:project"],
    ...overrides
  });
}

test("resident agents default to idle with canonical capabilities", () => {
  const value = resident({ capabilities: ["write:task-fork", "read:project", "read:project"] });
  assert.equal(value.state, "idle");
  assert.deepEqual(value.capabilities, ["read:project", "write:task-fork"]);
});

test("resume requires verified live state", () => {
  assert.throws(() => resumeResidentAgent(resident(), { verified: [] }), /verify live state/);
});

test("resume requires acknowledgement of the latest handoff", () => {
  const value = resident({ lastHandoffId: "H-9" });
  assert.throws(() => resumeResidentAgent(value, {
    acknowledgedHandoffId: "H-8",
    verified: ["branch head matches handoff"]
  }), /latest handoff/);
});

test("resident agent can resume from a verified handoff and return idle", () => {
  const value = resident({ lastHandoffId: "H-9" });
  const active = resumeResidentAgent(value, {
    acknowledgedHandoffId: "H-9",
    verified: ["branch head matches H-9", "tests were independently observed"],
    observedAt: "2026-10-05T23:20:00Z"
  });
  assert.equal(active.state, "active");
  assert.equal(active.resumedFromHandoffId, "H-9");
  const idle = idleResidentAgent(active, { handoffId: "H-10" });
  assert.equal(idle.state, "idle");
  assert.equal(idle.lastHandoffId, "H-10");
});

test("resident agent records reject private reasoning material", () => {
  assert.throws(() => validateResidentAgent({
    id: "a", role: "worker", capabilities: [], privateMemory: "nope"
  }), /private reasoning fields are forbidden/);
});

import { SemaLaneCoordinator } from "../src/coordinator.js";

test("coordinator persists a verified relay across snapshots", () => {
  const semalane = new SemaLaneCoordinator();
  semalane.registerContract({
    id: "TASK-1", agentId: "auth-worker", task: "auth", expectedOutcome: "works",
    resources: [], paths: ["src/auth"], contracts: [], constraints: []
  });
  semalane.registerResidentAgent({ id: "auth-worker", role: "worker", capabilities: ["read:project", "write:task-fork"] });
  semalane.registerResidentAgent({ id: "reviewer", role: "reviewer", capabilities: ["read:project", "review:evidence"] });
  semalane.resumeAgent("auth-worker", { verified: ["main head observed"], observedAt: "2026-10-05T23:20:00Z" });
  semalane.recordRelay({
    id: "H-1", kind: "HANDOFF", agentId: "auth-worker", recipientAgentId: "reviewer",
    contractId: "TASK-1", summary: "ready for review",
    received: ["task contract"], verified: ["main head observed"], changed: ["auth"],
    leaving: ["commit abc"], recommend: ["review invalid-token behavior"]
  });
  semalane.idleAgent("auth-worker", { handoffId: "H-1" });
  const restored = new SemaLaneCoordinator(semalane.snapshot());
  assert.equal(restored.snapshot().relay[0].id, "H-1");
  assert.equal(restored.snapshot().agents.find((item) => item.id === "auth-worker").lastHandoffId, "H-1");
});

test("coordinator refuses relay records for unknown contracts", () => {
  const semalane = new SemaLaneCoordinator();
  semalane.registerResidentAgent({ id: "a", role: "worker", capabilities: [] });
  assert.throws(() => semalane.recordRelay({
    id: "R", kind: "FINDING", agentId: "a", contractId: "missing", summary: "x"
  }), /unknown contract/);
});
