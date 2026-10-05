import test from "node:test";
import assert from "node:assert/strict";
import { renderControlRoom } from "../src/control-room.js";

function fixture() {
  return {
    snapshot: {
      missions: [{ id: "MISSION-1", objective: "Upgrade auth without breaking clients", boundaries: ["do not deploy"], successCriteria: ["compatibility evidenced"], state: "active" }],
      contracts: [
        { id: "TASK-1", agentId: "worker-a", task: "change auth", state: "completed", conflicts: [], artifact: { commit: "abcdef123456" } },
        { id: "TASK-2", agentId: "worker-b", task: "update client", state: "blocked", conflicts: [{ with: "TASK-1", reasons: [{ type: "semantic-contract", value: "public-api:auth-v2" }] }], artifact: {} }
      ],
      agents: [
        { id: "worker-a", role: "worker", state: "idle", capabilities: ["read:project", "write:task-fork"], lastHandoffId: "H-1" },
        { id: "reviewer-a", role: "reviewer", state: "active", capabilities: ["read:project", "review:evidence"] }
      ],
      relay: [
        { id: "H-1", kind: "HANDOFF", agentId: "worker-a", recipientAgentId: "reviewer-a", contractId: "TASK-1", summary: "ready for review", verified: ["tests pass"], leaving: ["commit abc"], recommend: ["probe invalid tokens"] }
      ]
    },
    composition: {
      accepted: [{ contractId: "TASK-1" }],
      held: [{ contractId: "TASK-2", blockers: ["unresolved-conflict"] }]
    },
    futures: {
      protocol: "semalane-futures-v1",
      futures: [
        { id: "safe-now", kind: "current", promotable: true, accepted: ["TASK-1"], held: ["TASK-2"], requirements: [] },
        { id: "unlock-task-2", kind: "counterfactual", promotable: false, accepted: ["TASK-1", "TASK-2"], held: [], requirements: ["unresolved-conflict"], subjectContractId: "TASK-2" }
      ]
    }
  };
}

test("control room surfaces resident team, relay, futures, and promotion boundary", () => {
  const { snapshot, composition, futures } = fixture();
  const html = renderControlRoom(snapshot, composition, futures);
  assert.match(html, /Mission/);
  assert.match(html, /Upgrade auth without breaking clients/);
  assert.match(html, /do not deploy/);
  assert.match(html, /Resident team/);
  assert.match(html, /Verified relay/);
  assert.match(html, /Candidate futures/);
  assert.match(html, /Promotion boundary/);
  assert.match(html, /worker-a/);
  assert.match(html, /ready for review/);
  assert.match(html, /unlock-task-2/);
  assert.match(html, /unresolved-conflict/);
});

test("control room remains read-only and explains governance", () => {
  const { snapshot, composition, futures } = fixture();
  const html = renderControlRoom(snapshot, composition, futures);
  assert.match(html, /observe/i);
  assert.match(html, /promotion requires explicit authority/i);
  assert.equal(html.includes("<form"), false);
  assert.equal(html.includes("method=\"post\""), false);
});

test("control room escapes relay and agent supplied HTML", () => {
  const { snapshot, composition, futures } = fixture();
  snapshot.agents[0].id = "<img src=x onerror=alert(1)>";
  snapshot.relay[0].summary = "<script>alert(1)</script>";
  const html = renderControlRoom(snapshot, composition, futures);
  assert.equal(html.includes("<script>alert(1)</script>"), false);
  assert.equal(html.includes("<img src=x onerror=alert(1)>"), false);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});


test("control room explains the product thesis without exposing mutation controls", () => {
  const html = renderControlRoom({
    missions: [{ id: "M1", objective: "Ship safely", boundaries: ["no deploy"], successCriteria: ["proof"] }],
    agents: [], relay: [], contracts: [], evidence: []
  }, { accepted: [], held: [] }, { futures: [] });
  assert.match(html, /Git versions code\. SemaLane versions continuity\./);
  assert.match(html, /Humans set the mission and boundaries/);
  assert.match(html, /Promotion requires explicit authority/);
  assert.doesNotMatch(html, /<button/i);
  assert.doesNotMatch(html, /<form/i);
});


test("control room includes narrow viewport and reduced-motion safeguards", () => {
  const html = renderControlRoom({ missions: [], agents: [], relay: [], contracts: [] }, { accepted: [], held: [] }, { futures: [] });
  assert.match(html, /@media\(max-width:480px\)/);
  assert.match(html, /min-width:680px/);
  assert.match(html, /prefers-reduced-motion:reduce/);
});
