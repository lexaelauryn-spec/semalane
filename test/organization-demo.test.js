import test from "node:test";
import assert from "node:assert/strict";
import { runOrganizationDemo } from "../demo/organization.js";

test("organization demo turns one mission into governed agent work", () => {
  const result = runOrganizationDemo();
  assert.equal(result.mission.id, "MISSION-DEMO");
  assert.equal(result.blockedAsExpected, true);
  assert.deepEqual(result.composition.accepted.map((item) => item.contractId), ["TASK-AUTH"]);
  assert.equal(result.composition.accepted.some((item) => item.contractId === "TASK-DOCS"), false);
  assert.equal(result.snapshot.relay.length, 3);
  assert.match(result.html, /Upgrade authentication without breaking existing clients/);
  assert.match(result.html, /TASK-DOCS/);
  assert.match(result.html, /Candidate futures/);
});

test("organization demo never promotes the blocked semantic collision", () => {
  const result = runOrganizationDemo();
  const safe = result.futures.futures.find((item) => item.id === "safe-now");
  const docsFuture = result.futures.futures.find((item) => item.subjectContractId === "TASK-DOCS");
  assert.deepEqual(safe.accepted, ["TASK-AUTH"]);
  assert.equal(safe.accepted.includes("TASK-DOCS"), false);
  assert.equal(docsFuture.promotable, false);
  assert.equal(docsFuture.requirements.includes("unresolved-conflict"), true);
});


test("organization demo is deterministic across repeated runs", () => {
  const a = runOrganizationDemo();
  const b = runOrganizationDemo();
  const project = (result) => ({
    mission: result.mission,
    contracts: result.snapshot.contracts,
    agents: result.snapshot.agents,
    relay: result.snapshot.relay,
    composition: result.composition,
    futures: result.futures
  });
  assert.deepEqual(project(a), project(b));
});
