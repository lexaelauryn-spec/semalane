import { validatePrivacyBoundary } from "./protocol.js";

function isoTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new Error("artifact workflow timestamp is invalid");
  }
  return date.toISOString();
}

export function hydrateArtifactEvent(raw, fallbackTimestamp) {
  validatePrivacyBoundary(raw);
  if (!raw || typeof raw !== "object") throw new TypeError("event must be an object");
  if (raw.metadata?.eventTimestamp) return raw;

  return {
    ...raw,
    metadata: {
      ...(raw.metadata ?? {}),
      eventTimestamp: isoTimestamp(fallbackTimestamp)
    }
  };
}

export function normalizeArtifactEvent(raw) {
  validatePrivacyBoundary(raw);
  if (!raw || typeof raw !== "object") throw new TypeError("event must be an object");
  if (raw.type !== "cf.artifacts.repo.pushed") {
    throw new Error(`unsupported artifact event: ${raw.type ?? "unknown"}`);
  }

  const repoName = raw.source?.repoName;
  const namespace = raw.source?.namespace;
  const commit = raw.payload?.after;
  const timestamp = raw.metadata?.eventTimestamp;

  if (!repoName || !namespace || !commit || !timestamp) {
    throw new Error("artifact push event is missing required fields");
  }

  return {
    id: `${namespace}/${repoName}:${commit}:${timestamp}`,
    type: raw.type,
    namespace,
    repoName,
    ref: raw.payload?.ref ?? null,
    before: raw.payload?.before ?? null,
    commit,
    commits: Array.isArray(raw.payload?.commits)
      ? raw.payload.commits.map((item) => ({
          id: item.id,
          message: item.message,
          timestamp: item.timestamp
        }))
      : [],
    totalCommitsCount: Number(raw.payload?.totalCommitsCount ?? 0),
    observedAt: timestamp
  };
}
