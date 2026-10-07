import { validatePrivacyBoundary } from "./protocol.js";

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
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))].sort();
}

export function validateMissionContract(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TypeError("mission must be an object");
  }
  validatePrivacyBoundary(raw);
  return {
    id: requiredString(raw.id, "mission.id"),
    objective: requiredString(raw.objective, "mission.objective"),
    boundaries: strings(raw.boundaries ?? [], "mission.boundaries"),
    successCriteria: strings(raw.successCriteria ?? [], "mission.successCriteria"),
    state: raw.state == null ? "active" : requiredString(raw.state, "mission.state")
  };
}
