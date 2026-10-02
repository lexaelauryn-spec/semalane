import test from "node:test";
import assert from "node:assert/strict";
import { SemaLaneCoordinator } from "../src/coordinator.js";
import { normalizeArtifactEvent } from "../src/artifact-events.js";
import { buildEvidenceGraph, scoreMergeCandidate } from "../src/evidence-graph.js";

function baseContract(overrides = {}) {
  return {
    id: "TASK-1",
    agentId: "agent-a",
    task: "change auth API",
    expectedOutcome: "auth v2 works",
    resources: [],
    paths: ["src/auth"],
    contracts: ["public-api:auth-v2"],
    constraints: [],
    ...overrides
  };
}

test("artifact push event normalizes without private author context", () => {
  const event = normalizeArtifactEvent({
    type: "cf.artifacts.repo.pushed",
    source: { namespace: "semalane", repoName: "task-task-1" },
    payload: {
      ref: "refs/heads/main",
      before: "a",
      after: "b",
      commits: [{ id: "b", message: "done", timestamp: "2026-10-01T00:00:00Z", author: { email: "private@example.com" } }],
      totalCommitsCount: 1
    },
    metadata: { eventTimestamp: "2026-10-01T00:00:01Z" }
  });
  assert.equal(event.commit, "b");
  assert.deepEqual(event.commits[0], { id: "b", message: "done", timestamp: "2026-10-01T00:00:00Z" });
});

test("push event binds an artifact commit to its work contract", () => {
  const semalane = new SemaLaneCoordinator();
  semalane.registerContract(baseContract());
  semalane.assignArtifact("TASK-1", { repoName: "task-task-1" });
  semalane.ingestEvent(normalizeArtifactEvent({
    type: "cf.artifacts.repo.pushed",
    source: { namespace: "semalane", repoName: "task-task-1" },
    payload: { ref: "refs/heads/main", before: "a", after: "b", commits: [], totalCommitsCount: 1 },
    metadata: { eventTimestamp: "2026-10-01T00:00:01Z" }
  }));
  assert.equal(semalane.snapshot().contracts[0].artifact.commit, "b");
});

test("completion requires an observed artifact commit", () => {
  const semalane = new SemaLaneCoordinator();
  semalane.registerContract(baseContract());
  assert.throws(() => semalane.completeContract("TASK-1"), /observed artifact commit/);
});

test("evidence graph links evidence and artifact events to a contract", () => {
  const graph = buildEvidenceGraph({
    contracts: [{ id: "TASK-1", task: "x", state: "completed" }],
    evidence: [{ id: "E-1", contractId: "TASK-1", kind: "test", outcome: "passed", summary: "passed" }],
    events: [{ id: "P-1", type: "cf.artifacts.repo.pushed", repoName: "r", contractId: "TASK-1" }]
  });
  assert.equal(graph.edges.length, 2);
});

test("merge score requires passing tests, approved review, artifact, and no conflict", () => {
  const candidate = scoreMergeCandidate(
    { id: "TASK-1", conflicts: [], artifact: { commit: "abc" } },
    [
      { id: "T", contractId: "TASK-1", kind: "test", outcome: "passed" },
      { id: "R", contractId: "TASK-1", kind: "review", outcome: "approved" }
    ]
  );
  assert.equal(candidate.score, 100);
  assert.equal(candidate.eligible, true);
});
