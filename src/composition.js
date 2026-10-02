import { evaluateReviewQuorum } from "./quorum.js";

function destinationName(accepted) {
  const suffix = accepted
    .map((item) => item.contractId.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
    .join("-")
    .slice(0, 48);
  return suffix ? `compose-${suffix}` : null;
}

export function buildCompositionPlan(snapshot, policy = {}) {
  const contracts = snapshot.contracts ?? [];
  const evidence = snapshot.evidence ?? [];
  const accepted = [];
  const held = [];

  for (const contract of contracts) {
    if (contract.state !== "completed") continue;

    const blockers = [];
    if (!contract.artifact?.commit) blockers.push("missing-artifact-commit");
    if ((contract.conflicts?.length ?? 0) > 0) blockers.push("unresolved-conflict");

    const hasTests = evidence.some((item) =>
      item.contractId === contract.id &&
      item.kind === "test" &&
      item.outcome === "passed"
    );
    if (!hasTests) blockers.push("missing-passing-tests");

    const quorum = evaluateReviewQuorum(contract, evidence, policy.review ?? {});
    if (!quorum.satisfied) blockers.push("review-quorum-not-satisfied");

    const candidate = {
      contractId: contract.id,
      agentId: contract.agentId,
      repoName: contract.artifact?.repoName ?? null,
      commit: contract.artifact?.commit ?? null,
      quorum,
      blockers
    };

    if (blockers.length === 0) accepted.push(candidate);
    else held.push(candidate);
  }

  accepted.sort((a, b) => a.contractId.localeCompare(b.contractId));
  held.sort((a, b) => a.contractId.localeCompare(b.contractId));

  const repoName = destinationName(accepted);

  return {
    protocol: "semalane-composition-v1",
    accepted,
    held,
    compositionId: accepted.length
      ? accepted.map((item) => `${item.contractId}@${item.commit}`).join("+")
      : null,
    compositionRepo: repoName ? {
      name: repoName,
      sources: accepted.map((item) => ({
        contractId: item.contractId,
        repoName: item.repoName,
        commit: item.commit
      })),
      strategy: "validate-then-compose"
    } : null
  };
}

export function markMerged(snapshot, contractIds) {
  const targets = new Set(contractIds);
  return {
    ...snapshot,
    contracts: (snapshot.contracts ?? []).map((contract) =>
      targets.has(contract.id) ? { ...contract, state: "merged" } : contract
    )
  };
}
