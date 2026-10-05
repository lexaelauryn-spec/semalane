import { SemaLaneCoordinator } from "../src/coordinator.js";
import { renderControlRoom } from "../src/control-room.js";

function contract(id, agentId, task, paths, contracts) {
  return {
    id, missionId: "MISSION-DEMO", agentId, task,
    expectedOutcome: task + " is evidenced and compatible",
    resources: [], paths, contracts, constraints: ["no-private-reasoning"]
  };
}

function review(id, contractId, reviewerId) {
  return { id, contractId, kind: "review", outcome: "approved", reviewerId, summary: "independent observable-behavior review approved" };
}

export function runOrganizationDemo() {
  const s = new SemaLaneCoordinator();
  s.registerMission({
    id: "MISSION-DEMO",
    objective: "Upgrade authentication without breaking existing clients",
    boundaries: ["do not deploy", "preserve public API compatibility", "no agent may self-review or self-promote"],
    successCriteria: ["tests pass", "two independent reviews approve", "semantic conflicts remain blocked"]
  });

  for (const agent of [
    { id: "auth-worker", role: "worker", capabilities: ["read:project", "write:task-fork"] },
    { id: "docs-worker", role: "worker", capabilities: ["read:project", "write:task-fork"] },
    { id: "reviewer-a", role: "reviewer", capabilities: ["read:project", "review:evidence"] },
    { id: "reviewer-b", role: "reviewer", capabilities: ["read:project", "review:evidence"] }
  ]) s.registerResidentAgent(agent);

  s.registerContract(contract("TASK-AUTH", "auth-worker", "Change auth API implementation", ["src/auth"], ["public-api:auth-v2"]));
  const docs = s.registerContract(contract("TASK-DOCS", "docs-worker", "Update auth client documentation", ["docs/client"], ["public-api:auth-v2"]));

  s.resumeAgent("auth-worker", { verified: ["MISSION-DEMO boundaries", "TASK-AUTH current state"] });
  s.assignArtifact("TASK-AUTH", { repoName: "task-auth", commit: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" });
  s.attachEvidence({ id: "TEST-AUTH", contractId: "TASK-AUTH", kind: "test", outcome: "passed", summary: "auth regression suite passed" });

  for (const reviewerId of ["reviewer-a", "reviewer-b"]) {
    s.resumeAgent(reviewerId, { verified: ["TASK-AUTH artifact aaaaaaaa", "mission boundaries"] });
    s.agentAttachEvidence(reviewerId, review("REVIEW-" + reviewerId.toUpperCase(), "TASK-AUTH", reviewerId));
    s.recordRelay({
      id: "HANDOFF-" + reviewerId.toUpperCase(), kind: "HANDOFF", agentId: reviewerId,
      recipientAgentId: "auth-worker", contractId: "TASK-AUTH", summary: "independent review complete",
      received: ["TASK-AUTH artifact"], verified: ["tests and observable behavior"], changed: [],
      leaving: ["review evidence recorded"], recommend: ["compose TASK-AUTH while TASK-DOCS remains blocked"]
    });
    s.idleAgent(reviewerId, { handoffId: "HANDOFF-" + reviewerId.toUpperCase() });
  }

  s.completeContract("TASK-AUTH");
  s.recordRelay({
    id: "HANDOFF-AUTH", kind: "HANDOFF", agentId: "auth-worker", recipientAgentId: "docs-worker",
    contractId: "TASK-AUTH", summary: "auth implementation evidenced; docs lane is semantically incompatible",
    received: ["MISSION-DEMO", "TASK-AUTH"], verified: ["tests passed", "two independent reviews"],
    changed: ["auth implementation artifact"], leaving: ["TASK-AUTH ready for composition"],
    recommend: ["resolve public-api:auth-v2 intent before unblocking TASK-DOCS"]
  });
  s.idleAgent("auth-worker", { handoffId: "HANDOFF-AUTH" });

  const snapshot = s.snapshot();
  const composition = s.compositionPlan({ review: { requiredReviewers: 2, requireSecurityEvidence: false } });
  const futures = s.candidateFutures({ review: { requiredReviewers: 2, requireSecurityEvidence: false } });

  return {
    mission: snapshot.missions[0],
    blockedAsExpected: docs.state === "blocked",
    snapshot,
    composition,
    futures,
    html: renderControlRoom(snapshot, composition, futures)
  };
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  const result = runOrganizationDemo();
  console.log(JSON.stringify({
    mission: result.mission.objective,
    agents: result.snapshot.agents.map(({ id, role, state }) => ({ id, role, state })),
    relay: result.snapshot.relay.map(({ id, kind, agentId, recipientAgentId }) => ({ id, kind, agentId, recipientAgentId })),
    accepted: result.composition.accepted.map((item) => item.contractId),
    held: result.composition.held.map((item) => ({ contractId: item.contractId, blockers: item.blockers })),
    futures: result.futures.futures
  }, null, 2));
}
