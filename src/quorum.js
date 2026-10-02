function uniqueApprovedReviewers(evidence, contractId) {
  const reviewers = new Set();
  for (const item of evidence) {
    if (
      item.contractId === contractId &&
      item.kind === "review" &&
      item.outcome === "approved" &&
      typeof item.reviewerId === "string" &&
      item.reviewerId.trim()
    ) {
      reviewers.add(item.reviewerId.trim());
    }
  }
  return reviewers;
}

export function evaluateReviewQuorum(contract, evidence, policy = {}) {
  const required = Number(policy.requiredReviewers ?? 2);
  const authorId = contract.agentId;
  const reviewers = uniqueApprovedReviewers(evidence, contract.id);
  reviewers.delete(authorId);

  const hasSecurity = evidence.some((item) =>
    item.contractId === contract.id &&
    item.kind === "security" &&
    item.outcome === "passed"
  );

  const securityRequired = Boolean(policy.requireSecurityEvidence);
  const independentReviewers = [...reviewers].sort();

  return {
    contractId: contract.id,
    requiredReviewers: required,
    independentReviewers,
    approvals: independentReviewers.length,
    securityRequired,
    securityPassed: hasSecurity,
    satisfied:
      independentReviewers.length >= required &&
      (!securityRequired || hasSecurity)
  };
}
