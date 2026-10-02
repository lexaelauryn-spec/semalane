export function buildCompositionManifest(plan) {
  return {
    protocol: plan.protocol,
    compositionId: plan.compositionId,
    strategy: plan.compositionRepo?.strategy ?? "validate-then-compose",
    sources: (plan.compositionRepo?.sources ?? []).map((source) => ({
      contractId: source.contractId,
      repoName: source.repoName,
      commit: source.commit
    }))
  };
}
