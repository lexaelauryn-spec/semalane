import test from "node:test";
import assert from "node:assert/strict";
import { validateMissionContract } from "../src/mission.js";
import { SemaLaneCoordinator } from "../src/coordinator.js";

test("mission contract keeps human objective and boundaries explicit", () => {
  const mission = validateMissionContract({
    id: "MISSION-1",
    objective: "Upgrade auth without breaking existing clients",
    boundaries: ["do not deploy", "preserve public API compatibility"],
    successCriteria: ["tests pass", "client compatibility is evidenced"]
  });
  assert.equal(mission.objective, "Upgrade auth without breaking existing clients");
  assert.deepEqual(mission.boundaries, ["do not deploy", "preserve public API compatibility"]);
});

test("mission rejects private reasoning material", () => {
  assert.throws(() => validateMissionContract({
    id: "M", objective: "x", privateMemory: "hidden"
  }), /private reasoning fields are forbidden/);
});

test("coordinator preserves mission across snapshots", () => {
  const semalane = new SemaLaneCoordinator();
  semalane.registerMission({
    id: "MISSION-1",
    objective: "Upgrade auth without breaking existing clients",
    boundaries: ["do not deploy"],
    successCriteria: ["tests pass"]
  });
  const restored = new SemaLaneCoordinator(semalane.snapshot());
  assert.equal(restored.snapshot().missions[0].id, "MISSION-1");
});

test("work contract may point at an existing mission", () => {
  const semalane = new SemaLaneCoordinator();
  semalane.registerMission({
    id: "MISSION-1", objective: "Upgrade auth", boundaries: [], successCriteria: []
  });
  const contract = semalane.registerContract({
    id: "TASK-1", missionId: "MISSION-1", agentId: "agent-a",
    task: "change auth", expectedOutcome: "auth works",
    resources: [], paths: ["src/auth"], contracts: [], constraints: []
  });
  assert.equal(contract.missionId, "MISSION-1");
});

test("work contract cannot point at an unknown mission", () => {
  const semalane = new SemaLaneCoordinator();
  assert.throws(() => semalane.registerContract({
    id: "TASK-1", missionId: "missing", agentId: "agent-a",
    task: "change auth", expectedOutcome: "auth works",
    resources: [], paths: ["src/auth"], contracts: [], constraints: []
  }), /unknown mission/);
});
