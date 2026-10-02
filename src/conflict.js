function normalizeResource(resource) {
  return String(resource).trim().toLowerCase();
}

function pathSegments(path) {
  return String(path).replaceAll("\\", "/").split("/").filter(Boolean);
}

function pathsOverlap(a, b) {
  const aa = pathSegments(a);
  const bb = pathSegments(b);
  const min = Math.min(aa.length, bb.length);
  for (let i = 0; i < min; i += 1) {
    if (aa[i] !== bb[i]) return false;
  }
  return true;
}

export function detectContractConflict(a, b) {
  const reasons = [];

  const aResources = new Set(a.resources.map(normalizeResource));
  for (const resource of b.resources.map(normalizeResource)) {
    if (aResources.has(resource)) {
      reasons.push({ type: "resource", value: resource });
    }
  }

  for (const left of a.paths) {
    for (const right of b.paths) {
      if (pathsOverlap(left, right)) {
        reasons.push({ type: "path", left, right });
      }
    }
  }

  const aContracts = new Set((a.contracts ?? []).map(normalizeResource));
  for (const item of (b.contracts ?? []).map(normalizeResource)) {
    if (aContracts.has(item)) reasons.push({ type: "semantic-contract", value: item });
  }

  return {
    conflict: reasons.length > 0,
    reasons
  };
}
