import test from "node:test";
import assert from "node:assert/strict";
import { buildCandidateFutures } from "../src/futures.js";

const policy = { review: { requiredReviewers: 2 } };

test("candidate futures expose the safe current composition", () => {
  const snapshot = {
    contracts: [
      { id: "T1", agentId: "a", state: "completed", conflicts: [], artifact: { repoName: "r1", commit: "abc" } }
    ],
    evidence: [
      { contractId: "T1", kind: "test", outcome: "passed" },
      { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r1" },
      { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r2" }
    ]
  };
  const result = buildCandidateFutures(snapshot, policy);
  assert.deepEqual(result.futures[0].accepted, ["T1"]);
  assert.equal(result.futures[0].promotable, true);
});

test("held work becomes a non-promotable counterfactual with explicit unlock requirements", () => {
  const snapshot = {
    contracts: [
      { id: "T1", agentId: "a", state: "completed", conflicts: [], artifact: { repoName: "r1", commit: "abc" } },
      { id: "T2", agentId: "b", state: "completed", conflicts: [], artifact: { repoName: "r2", commit: "def" } }
    ],
    evidence: [
      { contractId: "T1", kind: "test", outcome: "passed" },
      { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r1" },
      { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r2" },
      { contractId: "T2", kind: "test", outcome: "passed" }
    ]
  };
  const result = buildCandidateFutures(snapshot, policy);
  const future = result.futures.find((item) => item.subjectContractId === "T2");
  assert.equal(future.promotable, false);
  assert.deepEqual(future.accepted, ["T1", "T2"]);
  assert.deepEqual(future.requirements, ["review-quorum-not-satisfied"]);
});

test("candidate futures are descriptive only and do not mutate snapshot state", () => {
  const snapshot = {
    contracts: [{ id: "T2", agentId: "b", state: "completed", conflicts: [{ with: "T1" }], artifact: { repoName: "r2", commit: "def" } }],
    evidence: []
  };
  const before = structuredClone(snapshot);
  buildCandidateFutures(snapshot, policy);
  assert.deepEqual(snapshot, before);
});


test("blocked semantic work appears as an explicit counterfactual future", () => {
  const snapshot = {
    contracts: [
      { id: "T1", agentId: "a", state: "completed", conflicts: [], artifact: { repoName: "r1", commit: "abc" } },
      { id: "T2", agentId: "b", state: "blocked", conflicts: [{ with: "T1", reasons: [{ type: "semantic-contract", value: "api:v2" }] }] }
    ],
    evidence: [
      { contractId: "T1", kind: "test", outcome: "passed" },
      { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r1" },
      { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r2" }
    ]
  };
  const result = buildCandidateFutures(snapshot, policy);
  const future = result.futures.find((item) => item.subjectContractId === "T2");
  assert.equal(future.promotable, false);
  assert.equal(future.requirements.includes("unresolved-conflict"), true);
  assert.equal(future.requirements.includes("complete-work"), true);
});
