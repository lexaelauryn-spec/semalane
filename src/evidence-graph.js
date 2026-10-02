function evidenceScore(item) {
  if (item.kind === "test" && item.outcome === "passed") return 40;
  if (item.kind === "review" && item.outcome === "approved") return 30;
  if (item.kind === "security" && item.outcome === "passed") return 20;
  if (item.kind === "build" && item.outcome === "passed") return 20;
  return 0;
}

export function buildEvidenceGraph(snapshot) {
  const nodes = [];
  const edges = [];

  for (const contract of snapshot.contracts ?? []) {
    nodes.push({
      id: `contract:${contract.id}`,
      kind: "contract",
      label: contract.task,
      state: contract.state
    });
  }

  for (const evidence of snapshot.evidence ?? []) {
    nodes.push({
      id: `evidence:${evidence.id}`,
      kind: "evidence",
      label: evidence.summary,
      evidenceKind: evidence.kind,
      outcome: evidence.outcome ?? "unknown"
    });
    edges.push({
      from: `evidence:${evidence.id}`,
      to: `contract:${evidence.contractId}`,
      relation: "supports"
    });
  }

  for (const event of snapshot.events ?? []) {
    nodes.push({
      id: `event:${event.id}`,
      kind: "artifact-event",
      label: event.type,
      repoName: event.repoName
    });
    if (event.contractId) {
      edges.push({
        from: `event:${event.id}`,
        to: `contract:${event.contractId}`,
        relation: "observed"
      });
    }
  }

  return { nodes, edges };
}

export function scoreMergeCandidate(contract, allEvidence) {
  const evidence = allEvidence.filter((item) => item.contractId === contract.id);
  const evidencePoints = evidence.reduce((sum, item) => sum + evidenceScore(item), 0);
  const artifactPoints = contract.artifact?.commit ? 20 : 0;
  const conflictPoints = (contract.conflicts?.length ?? 0) === 0 ? 10 : 0;
  const score = Math.min(100, evidencePoints + artifactPoints + conflictPoints);

  const blockers = [];
  if ((contract.conflicts?.length ?? 0) > 0) blockers.push("unresolved-conflict");
  if (!contract.artifact?.commit) blockers.push("missing-artifact-commit");
  if (!evidence.some((item) => item.kind === "test" && item.outcome === "passed")) {
    blockers.push("missing-passing-tests");
  }
  if (!evidence.some((item) => item.kind === "review" && item.outcome === "approved")) {
    blockers.push("missing-approved-review");
  }

  return {
    contractId: contract.id,
    score,
    eligible: blockers.length === 0 && score >= 90,
    blockers,
    evidenceIds: evidence.map((item) => item.id)
  };
}

export function buildMergePlan(snapshot) {
  const candidates = (snapshot.contracts ?? [])
    .filter((contract) => contract.state === "completed")
    .map((contract) => scoreMergeCandidate(contract, snapshot.evidence ?? []))
    .sort((a, b) => b.score - a.score || a.contractId.localeCompare(b.contractId));

  return {
    generatedAt: new Date(0).toISOString(),
    eligible: candidates.filter((item) => item.eligible),
    held: candidates.filter((item) => !item.eligible)
  };
}
