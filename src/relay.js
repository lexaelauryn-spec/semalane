import { validatePrivacyBoundary } from "./protocol.js";

export const RELAY_KINDS = Object.freeze([
  "HANDOFF",
  "BLOCKER",
  "REVIEW_REQUEST",
  "FINDING",
  "DECISION",
  "RECOMMENDATION",
  "SUPERSESSION"
]);

function requiredString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(name + " must be a non-empty string");
  }
  return value.trim();
}

function strings(value, name) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new TypeError(name + " must be an array of strings");
  }
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
}

export function validateRelayRecord(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TypeError("relay record must be an object");
  }
  validatePrivacyBoundary(raw);
  const kind = requiredString(raw.kind, "relay.kind").toUpperCase();
  if (!RELAY_KINDS.includes(kind)) throw new Error("unsupported relay kind");
  const record = {
    id: requiredString(raw.id, "relay.id"),
    kind,
    agentId: requiredString(raw.agentId, "relay.agentId"),
    contractId: requiredString(raw.contractId, "relay.contractId"),
    summary: requiredString(raw.summary, "relay.summary"),
    refs: strings(raw.refs, "relay.refs")
  };
  if (raw.recipientAgentId != null) record.recipientAgentId = requiredString(raw.recipientAgentId, "relay.recipientAgentId");
  if (raw.supersedes != null) record.supersedes = requiredString(raw.supersedes, "relay.supersedes");
  if (raw.observedAt != null) record.observedAt = requiredString(raw.observedAt, "relay.observedAt");
  return record;
}

export function validateHandoff(raw) {
  const record = validateRelayRecord(raw);
  if (record.kind !== "HANDOFF") throw new Error("handoff must use HANDOFF kind");
  for (const key of ["received", "verified", "changed", "leaving", "recommend"]) {
    record[key] = strings(raw[key], "handoff." + key);
  }
  if (record.verified.length === 0) throw new Error("handoff must include verified state");
  if (record.leaving.length === 0) throw new Error("handoff must include leaving state");
  return record;
}

export function isSuperseded(record, records) {
  return records.some((candidate) => candidate.kind === "SUPERSESSION" && candidate.supersedes === record.id);
}
