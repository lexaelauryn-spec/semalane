import { buildCompositionPlan } from "./composition.js";

function unlockRequirements(candidate) {
  return [...new Set(candidate.blockers ?? [])].sort();
}

export function buildCandidateFutures(snapshot, policy = {}) {
  const current = buildCompositionPlan(snapshot, policy);
  const futures = [];

  futures.push({
    id: "safe-now",
    kind: "current",
    promotable: current.accepted.length > 0,
    accepted: current.accepted.map((item) => item.contractId),
    held: current.held.map((item) => item.contractId),
    requirements: []
  });

  for (const candidate of current.held) {
    futures.push({
      id: "unlock-" + candidate.contractId.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      kind: "counterfactual",
      promotable: false,
      accepted: [...current.accepted.map((item) => item.contractId), candidate.contractId].sort(),
      held: current.held.filter((item) => item.contractId !== candidate.contractId).map((item) => item.contractId),
      requirements: unlockRequirements(candidate),
      subjectContractId: candidate.contractId
    });
  }

  return {
    protocol: "semalane-futures-v1",
    generatedFrom: current.compositionId,
    futures
  };
}
