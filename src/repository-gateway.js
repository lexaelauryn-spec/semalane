const PROVIDERS = new Set(["github", "gitlab", "forgejo", "gitea", "generic-git"]);

const ACTIONS = new Set([
  "read",
  "create-branch",
  "push-branch",
  "open-pr",
  "update-pr",
  "merge",
  "deploy",
  "production-write",
  "secrets-read",
  "secrets-write",
  "admin"
]);

const CONSEQUENCE_GATED = new Set([
  "merge",
  "deploy",
  "production-write",
  "secrets-read",
  "secrets-write",
  "admin"
]);

function assertObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
}

function assertString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

function canonicalActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    throw new TypeError("grant.actions must be a non-empty array");
  }

  const normalized = [...new Set(actions.map((action) => String(action).trim()))].sort();
  for (const action of normalized) {
    if (!ACTIONS.has(action)) throw new Error(`unsupported repository action: ${action}`);
  }
  return normalized;
}

function assertNoCredentialMaterial(value, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoCredentialMaterial(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    if (/(token|secret|password|private.?key|credential)/i.test(key)) {
      throw new Error(`credential material is forbidden in repository grants: ${path}.${key}`);
    }
    assertNoCredentialMaterial(child, `${path}.${key}`);
  }
}

export function validateRepositoryGrant(grant) {
  assertObject(grant, "grant");
  assertNoCredentialMaterial(grant);

  for (const key of ["id", "ownerId", "provider", "repositoryId", "repository", "installationId"]) {
    assertString(grant[key], `grant.${key}`);
  }

  if (!PROVIDERS.has(grant.provider)) {
    throw new Error(`unsupported repository provider: ${grant.provider}`);
  }

  const actions = canonicalActions(grant.actions);
  const consequenceActions = actions.filter((action) => CONSEQUENCE_GATED.has(action));

  if (consequenceActions.length && grant.ownerGate !== true) {
    throw new Error(`consequence-sensitive actions require ownerGate=true: ${consequenceActions.join(", ")}`);
  }

  let expiresAt = null;
  if (grant.expiresAt != null) {
    const timestamp = Date.parse(grant.expiresAt);
    if (Number.isNaN(timestamp)) throw new Error("grant.expiresAt must be an ISO-compatible date");
    expiresAt = new Date(timestamp).toISOString();
  }

  return {
    id: grant.id,
    ownerId: grant.ownerId,
    provider: grant.provider,
    repositoryId: grant.repositoryId,
    repository: grant.repository,
    installationId: grant.installationId,
    actions,
    ownerGate: grant.ownerGate === true,
    expiresAt,
    revokedAt: grant.revokedAt ?? null,
    metadata: grant.metadata && typeof grant.metadata === "object" && !Array.isArray(grant.metadata)
      ? { ...grant.metadata }
      : {}
  };
}

export function authorizeRepositoryAction(grant, request, now = new Date()) {
  const normalized = validateRepositoryGrant(grant);
  assertObject(request, "request");
  for (const key of ["provider", "repositoryId", "action"]) {
    assertString(request[key], `request.${key}`);
  }

  if (normalized.revokedAt) {
    return { allowed: false, reason: "grant-revoked" };
  }

  if (normalized.expiresAt && Date.parse(normalized.expiresAt) <= now.getTime()) {
    return { allowed: false, reason: "grant-expired" };
  }

  if (request.provider !== normalized.provider || request.repositoryId !== normalized.repositoryId) {
    return { allowed: false, reason: "repository-out-of-scope" };
  }

  if (!normalized.actions.includes(request.action)) {
    return { allowed: false, reason: "action-not-granted" };
  }

  if (CONSEQUENCE_GATED.has(request.action)) {
    return {
      allowed: false,
      reason: "owner-gate-required",
      ownerGate: true
    };
  }

  return {
    allowed: true,
    reason: "granted",
    grantId: normalized.id,
    repository: normalized.repository,
    action: request.action
  };
}

export function createRepositoryWorkBinding(grant, contractId, requestedActions = []) {
  const normalized = validateRepositoryGrant(grant);
  assertString(contractId, "contractId");
  const actions = canonicalActions(requestedActions);

  for (const action of actions) {
    if (!normalized.actions.includes(action)) {
      throw new Error(`work binding exceeds repository grant: ${action}`);
    }
  }

  return {
    contractId,
    grantId: normalized.id,
    provider: normalized.provider,
    repositoryId: normalized.repositoryId,
    repository: normalized.repository,
    installationId: normalized.installationId,
    actions,
    ownerGateRequired: actions.some((action) => CONSEQUENCE_GATED.has(action))
  };
}

export const repositoryGatewayPolicy = Object.freeze({
  providers: [...PROVIDERS].sort(),
  actions: [...ACTIONS].sort(),
  consequenceGatedActions: [...CONSEQUENCE_GATED].sort()
});
