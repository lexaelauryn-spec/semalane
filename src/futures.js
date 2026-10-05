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

  const represented = new Set();

  for (const candidate of current.held) {
    represented.add(candidate.contractId);
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

  for (const contract of snapshot.contracts ?? []) {
    if (contract.state !== "blocked" || represented.has(contract.id)) continue;
    const requirements = ["complete-work"];
    if ((contract.conflicts?.length ?? 0) > 0) requirements.push("unresolved-conflict");
    if (!contract.artifact?.commit) requirements.push("missing-artifact-commit");
    futures.push({
      id: "unlock-" + contract.id.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      kind: "counterfactual",
      promotable: false,
      accepted: [...current.accepted.map((item) => item.contractId), contract.id].sort(),
      held: current.held.map((item) => item.contractId),
      requirements: [...new Set(requirements)].sort(),
      subjectContractId: contract.id
    });
  }

  return {
    protocol: "semalane-futures-v1",
    generatedFrom: current.compositionId,
    futures
  };
}
