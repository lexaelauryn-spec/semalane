import test from "node:test";
import assert from "node:assert/strict";
import {
  authorizeRepositoryAction,
  createRepositoryWorkBinding,
  repositoryGatewayPolicy,
  validateRepositoryGrant
} from "../src/repository-gateway.js";

function grant(overrides = {}) {
  return {
    id: "grant-discordian-mexir",
    ownerId: "discordian",
    provider: "github",
    repositoryId: "123456",
    repository: "discordianrecords/platform",
    installationId: "987654",
    actions: ["read", "create-branch", "push-branch", "open-pr"],
    ...overrides
  };
}

test("repository grants canonicalize allowed actions", () => {
  const value = validateRepositoryGrant(grant({ actions: ["read", "open-pr", "read"] }));
  assert.deepEqual(value.actions, ["open-pr", "read"]);
});

test("repository grants reject credential material", () => {
  assert.throws(
    () => validateRepositoryGrant(grant({ metadata: { token: "do-not-store-me" } })),
    /credential material is forbidden/
  );
});

test("repository access is deny-by-default outside the exact repository", () => {
  const result = authorizeRepositoryAction(grant(), {
    provider: "github",
    repositoryId: "other-repo",
    action: "read"
  });
  assert.deepEqual(result, { allowed: false, reason: "repository-out-of-scope" });
});

test("ungranted actions are blocked", () => {
  const result = authorizeRepositoryAction(grant(), {
    provider: "github",
    repositoryId: "123456",
    action: "merge"
  });
  assert.deepEqual(result, { allowed: false, reason: "action-not-granted" });
});

test("consequence-sensitive permissions require an owner gate and still stop at the gate", () => {
  const elevated = grant({
    actions: ["read", "merge"],
    ownerGate: true
  });
  const result = authorizeRepositoryAction(elevated, {
    provider: "github",
    repositoryId: "123456",
    action: "merge"
  });
  assert.deepEqual(result, {
    allowed: false,
    reason: "owner-gate-required",
    ownerGate: true
  });
});

test("expired or revoked grants fail closed", () => {
  const expired = authorizeRepositoryAction(grant({ expiresAt: "2026-10-01T00:00:00Z" }), {
    provider: "github",
    repositoryId: "123456",
    action: "read"
  }, new Date("2026-10-07T00:00:00Z"));
  assert.equal(expired.reason, "grant-expired");

  const revoked = authorizeRepositoryAction(grant({ revokedAt: "2026-10-06T00:00:00Z" }), {
    provider: "github",
    repositoryId: "123456",
    action: "read"
  });
  assert.equal(revoked.reason, "grant-revoked");
});

test("work bindings cannot exceed their repository grant", () => {
  assert.throws(
    () => createRepositoryWorkBinding(grant(), "TASK-DISCORDIAN", ["read", "merge"]),
    /exceeds repository grant/
  );

  const binding = createRepositoryWorkBinding(grant(), "TASK-DISCORDIAN", ["read", "open-pr"]);
  assert.equal(binding.contractId, "TASK-DISCORDIAN");
  assert.equal(binding.repository, "discordianrecords/platform");
  assert.deepEqual(binding.actions, ["open-pr", "read"]);
  assert.equal(binding.ownerGateRequired, false);
});

test("gateway policy is provider-neutral while GitHub is a supported adapter", () => {
  assert.ok(repositoryGatewayPolicy.providers.includes("github"));
  assert.ok(repositoryGatewayPolicy.providers.includes("forgejo"));
  assert.ok(repositoryGatewayPolicy.providers.includes("generic-git"));
});
