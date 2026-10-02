export function buildResolutionTickets(snapshot) {
  const tickets = [];

  for (const contract of snapshot.contracts ?? []) {
    if (contract.state !== "blocked") continue;

    for (const conflict of contract.conflicts ?? []) {
      tickets.push({
        id: `resolve:${contract.id}:${conflict.with}`,
        blockedContractId: contract.id,
        conflictingContractId: conflict.with,
        reasons: conflict.reasons ?? [],
        acceptableResolutions: [
          "revise-work-contract",
          "wait-for-predecessor-merge",
          "withdraw-conflicting-contract"
        ],
        requiresPrivateReasoning: false
      });
    }
  }

  return tickets.sort((a, b) => a.id.localeCompare(b.id));
}
