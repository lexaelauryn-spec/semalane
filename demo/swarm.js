import { SemaLaneCoordinator } from "../src/coordinator.js";
import { normalizeArtifactEvent } from "../src/artifact-events.js";
import { createContextCommitment } from "../src/commitments.js";
import { buildCompositionPlan } from "../src/composition.js";

const semalane = new SemaLaneCoordinator();

function task(n, overrides = {}) {
  return {
    id: `TASK-${n}`,
    agentId: `agent-${String(n).padStart(2, "0")}`,
    task: `parallel change ${n}`,
    expectedOutcome: `observable outcome ${n}`,
    resources: [`service:${n}`],
    paths: [`src/lane-${n}`],
    contracts: [`contract:${n}`],
    constraints: ["no-private-reasoning"],
    ...overrides
  };
}

for (let n = 1; n <= 12; n += 1) {
  const contextCommitment = await createContextCommitment({
    scope: "demo-agent-policy",
    version: `v${n}`,
    privateDescriptor: { syntheticPolicyEpoch: n },
    nonce: `demo-nonce-${String(n).padStart(4, "0")}-0123456789abcdef`
  });

  const overrides = n === 12
    ? { resources: [], paths: ["docs/client"], contracts: ["public-api:auth-v2"], contextCommitment }
    : n === 3
      ? { resources: [], paths: ["src/auth"], contracts: ["public-api:auth-v2"], contextCommitment }
      : { contextCommitment };

  const registered = semalane.registerContract(task(n, overrides));
  if (registered.state === "blocked") continue;

  semalane.assignArtifact(registered.id, { repoName: `task-${registered.id.toLowerCase()}` });

  semalane.ingestEvent(normalizeArtifactEvent({
    type: "cf.artifacts.repo.pushed",
    source: { type: "artifacts.repo", namespace: "semalane", repoName: `task-${registered.id.toLowerCase()}` },
    payload: {
      ref: "refs/heads/main",
      before: "0".repeat(40),
      after: String(n).padStart(40, "a"),
      commits: [{ id: String(n).padStart(40, "a"), message: `agent ${n} result`, timestamp: "2026-10-01T00:00:00.000Z" }],
      totalCommitsCount: 1
    },
    metadata: { eventTimestamp: `2026-10-01T00:00:${String(n).padStart(2, "0")}.000Z` }
  }));

  semalane.attachEvidence({
    id: `TEST-${n}`,
    contractId: registered.id,
    kind: "test",
    outcome: "passed",
    summary: "focused test suite passed"
  });

  for (const reviewerId of [`reviewer-a-${n}`, `reviewer-b-${n}`]) {
    semalane.attachEvidence({
      id: `REVIEW-${reviewerId}`,
      contractId: registered.id,
      kind: "review",
      outcome: "approved",
      reviewerId,
      summary: "independent reviewer approved observable behavior"
    });
  }

  semalane.completeContract(registered.id);
}

const snapshot = semalane.snapshot();
const composition = buildCompositionPlan(snapshot, { review: { requiredReviewers: 2 } });

console.log(JSON.stringify({
  agents: 12,
  completed: snapshot.contracts.filter((item) => item.state === "completed").length,
  blocked: snapshot.contracts.filter((item) => item.state === "blocked").map((item) => ({
    id: item.id,
    conflicts: item.conflicts
  })),
  commitments: snapshot.contracts.filter((item) => Boolean(item.contextCommitment)).length,
  events: snapshot.events.length,
  evidence: snapshot.evidence.length,
  compositionReady: composition.accepted.length,
  compositionHeld: composition.held
}, null, 2));
