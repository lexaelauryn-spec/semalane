import test from "node:test";
import assert from "node:assert/strict";
import { createContextCommitment, verifyContextCommitment } from "../src/commitments.js";
import { validateWorkContract } from "../src/protocol.js";
import { evaluateReviewQuorum } from "../src/quorum.js";
import { buildCompositionPlan } from "../src/composition.js";
import { buildResolutionTickets } from "../src/resolution.js";
import { SemaLaneCoordinator } from "../src/coordinator.js";
import { renderControlRoom } from "../src/control-room.js";
import { evaluatePreflight } from "../src/preflight.js";

test("context commitments verify without exposing the private descriptor", async () => {
  const opening = {
    scope: "agent-policy",
    version: "7",
    privateDescriptor: { policyHash: "internal-value", memoryEpoch: 91 },
    nonce: "0123456789abcdef0123456789abcdef"
  };
  const commitment = await createContextCommitment(opening);
  assert.equal(await verifyContextCommitment(commitment, opening), true);
  assert.equal("privateDescriptor" in commitment, false);
  assert.equal("nonce" in commitment, false);
});

test("changed private context fails the commitment opening", async () => {
  const opening = {
    scope: "agent-policy",
    version: "7",
    privateDescriptor: { policyHash: "a" },
    nonce: "0123456789abcdef"
  };
  const commitment = await createContextCommitment(opening);
  assert.equal(await verifyContextCommitment(commitment, { ...opening, privateDescriptor: { policyHash: "b" } }), false);
});

test("work contracts reject commitment opening material", () => {
  assert.throws(() => validateWorkContract({
    id: "T1",
    agentId: "a",
    task: "x",
    expectedOutcome: "y",
    resources: [],
    paths: [],
    privateDescriptor: { hidden: true }
  }), /private reasoning fields are forbidden/);
});

test("review quorum excludes author and deduplicates reviewers", () => {
  const contract = { id: "T1", agentId: "author" };
  const evidence = [
    { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "author" },
    { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r1" },
    { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r1" },
    { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r2" }
  ];
  const quorum = evaluateReviewQuorum(contract, evidence, { requiredReviewers: 2 });
  assert.equal(quorum.satisfied, true);
  assert.deepEqual(quorum.independentReviewers, ["r1", "r2"]);
});

test("composition holds work that lacks quorum", () => {
  const snapshot = {
    contracts: [{ id: "T1", agentId: "a", state: "completed", conflicts: [], artifact: { repoName: "r", commit: "abc" } }],
    evidence: [
      { contractId: "T1", kind: "test", outcome: "passed" },
      { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r1" }
    ]
  };
  const plan = buildCompositionPlan(snapshot, { review: { requiredReviewers: 2 } });
  assert.equal(plan.accepted.length, 0);
  assert.equal(plan.held[0].blockers.includes("review-quorum-not-satisfied"), true);
});

test("composition creates a deterministic repository plan", () => {
  const snapshot = {
    contracts: [{ id: "T1", agentId: "a", state: "completed", conflicts: [], artifact: { repoName: "task-t1", commit: "abc" } }],
    evidence: [
      { contractId: "T1", kind: "test", outcome: "passed" },
      { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r1" },
      { contractId: "T1", kind: "review", outcome: "approved", reviewerId: "r2" }
    ]
  };
  const plan = buildCompositionPlan(snapshot, { review: { requiredReviewers: 2 } });
  assert.equal(plan.accepted.length, 1);
  assert.equal(plan.compositionRepo.name, "compose-t1");
  assert.deepEqual(plan.compositionRepo.sources[0], { contractId: "T1", repoName: "task-t1", commit: "abc" });
});

test("resolution tickets expose conflict facts without private reasoning", () => {
  const tickets = buildResolutionTickets({
    contracts: [{
      id: "T2",
      state: "blocked",
      conflicts: [{ with: "T1", reasons: [{ type: "semantic-contract", value: "api:v1" }] }]
    }]
  });
  assert.equal(tickets.length, 1);
  assert.equal(tickets[0].requiresPrivateReasoning, false);
  assert.equal(tickets[0].reasons[0].type, "semantic-contract");
});

test("merged work releases semantic territory", () => {
  const semalane = new SemaLaneCoordinator();
  semalane.registerContract({
    id: "T1", agentId: "a", task: "x", expectedOutcome: "x",
    resources: [], paths: ["src/a"], contracts: ["api:v1"], constraints: []
  });
  semalane.assignArtifact("T1", { repoName: "r", commit: "abc" });
  semalane.completeContract("T1");
  semalane.markMerged(["T1"]);
  const second = semalane.registerContract({
    id: "T2", agentId: "b", task: "y", expectedOutcome: "y",
    resources: [], paths: ["src/b"], contracts: ["api:v1"], constraints: []
  });
  assert.equal(second.state, "active");
});

test("control room escapes agent-supplied HTML", () => {
  const html = renderControlRoom({
    contracts: [{ id: "<x>", agentId: "a", task: "<script>alert(1)</script>", state: "blocked", conflicts: [], artifact: {} }]
  }, { accepted: [], held: [] });
  assert.equal(html.includes("<script>alert(1)</script>"), false);
  assert.equal(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), true);
});

test("preflight detects obvious secrets", () => {
  const fixture = 'const api_' + 'key = "' + 'super-secret-value";';
  const result = evaluatePreflight([{ path: "x.js", content: fixture }]);
  assert.equal(result.ok, false);
});

test("preflight protected terms are supplied outside the public repository", () => {
  const protectedTerm = ["INTERNAL", "CODENAME"].join("_");
  const result = evaluatePreflight(
    [{ path: "x.md", content: protectedTerm }],
    { protectedTerms: [protectedTerm] }
  );
  assert.equal(result.ok, false);
  assert.equal(result.findings[0].type, "protected-term");
});
