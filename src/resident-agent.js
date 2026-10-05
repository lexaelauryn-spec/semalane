import { validatePrivacyBoundary } from "./protocol.js";

export const AGENT_STATES = Object.freeze(["idle", "active"]);

function requiredString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(name + " must be a non-empty string");
  }
  return value.trim();
}

function stringList(value, name) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new TypeError(name + " must be an array of strings");
  }
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))].sort();
}

export function validateResidentAgent(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TypeError("resident agent must be an object");
  }
  validatePrivacyBoundary(raw);
  return {
    id: requiredString(raw.id, "agent.id"),
    role: requiredString(raw.role, "agent.role"),
    capabilities: stringList(raw.capabilities ?? [], "agent.capabilities"),
    state: raw.state == null ? "idle" : requiredString(raw.state, "agent.state"),
    lastHandoffId: raw.lastHandoffId == null ? null : requiredString(raw.lastHandoffId, "agent.lastHandoffId"),
    lastActiveAt: raw.lastActiveAt == null ? null : requiredString(raw.lastActiveAt, "agent.lastActiveAt")
  };
}

export function resumeResidentAgent(agent, { acknowledgedHandoffId = null, verified = [], observedAt = null } = {}) {
  if (!agent) throw new Error("unknown resident agent");
  if (agent.state === "active") throw new Error("resident agent is already active");
  if (agent.lastHandoffId && acknowledgedHandoffId !== agent.lastHandoffId) {
    throw new Error("resident agent must acknowledge its latest handoff before resume");
  }
  const facts = stringList(verified, "agent.verified");
  if (facts.length === 0) throw new Error("resident agent must verify live state before resume");
  return {
    ...agent,
    state: "active",
    resumedFromHandoffId: acknowledgedHandoffId,
    verified: facts,
    lastActiveAt: observedAt ?? new Date(0).toISOString()
  };
}

export function idleResidentAgent(agent, { handoffId, observedAt = null } = {}) {
  if (!agent) throw new Error("unknown resident agent");
  if (agent.state !== "active") throw new Error("only an active resident agent can become idle");
  return {
    ...agent,
    state: "idle",
    lastHandoffId: requiredString(handoffId, "agent.handoffId"),
    lastActiveAt: observedAt ?? agent.lastActiveAt ?? new Date(0).toISOString()
  };
}
