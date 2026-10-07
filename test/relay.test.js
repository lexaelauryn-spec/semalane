import test from "node:test";
import assert from "node:assert/strict";
import { validateHandoff, validateRelayRecord, isSuperseded } from "../src/relay.js";

function handoff(overrides = {}) {
  return {
    id: "R-1", kind: "HANDOFF", agentId: "agent-a", recipientAgentId: "agent-b",
    contractId: "TASK-1", summary: "auth work ready for review",
    received: ["TASK-1 at commit abc"], verified: ["tests pass at abc"],
    changed: ["tightened token validation"], leaving: ["commit def ready for review"],
    recommend: ["run adversarial invalid-token cases"], refs: ["commit:def"], ...overrides
  };
}

test("verified handoff preserves relay fields", () => {
  const value = validateHandoff(handoff());
  assert.deepEqual(value.verified, ["tests pass at abc"]);
  assert.deepEqual(value.leaving, ["commit def ready for review"]);
  assert.deepEqual(value.recommend, ["run adversarial invalid-token cases"]);
});

test("handoff fails closed without verified live state", () => {
  assert.throws(() => validateHandoff(handoff({ verified: [] })), /verified state/);
});

test("handoff fails closed without leaving state", () => {
  assert.throws(() => validateHandoff(handoff({ leaving: [] })), /leaving state/);
});

test("relay rejects private reasoning fields recursively", () => {
  assert.throws(() => validateRelayRecord({ ...handoff(), kind: "FINDING", detail: { chainOfThought: "private" } }), /private reasoning fields are forbidden/);
});

test("recommendations remain typed recommendations", () => {
  const value = validateRelayRecord({ id: "R-2", kind: "RECOMMENDATION", agentId: "reviewer-a", contractId: "TASK-1", summary: "exercise expiry boundary next" });
  assert.equal(value.kind, "RECOMMENDATION");
});

test("supersession makes stale relay state detectable", () => {
  const old = validateRelayRecord({ id: "R-old", kind: "FINDING", agentId: "agent-a", contractId: "TASK-1", summary: "endpoint appears healthy" });
  const newer = validateRelayRecord({ id: "R-new", kind: "SUPERSESSION", agentId: "agent-b", contractId: "TASK-1", summary: "later probe invalidated prior finding", supersedes: "R-old" });
  assert.equal(isSuperseded(old, [old, newer]), true);
});
