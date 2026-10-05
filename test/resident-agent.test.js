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
