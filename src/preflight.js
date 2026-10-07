const SECRET_PATTERNS = [
  { name: "generic-api-key", re: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{8,}["']/gi },
  { name: "openai-key", re: /sk-[A-Za-z0-9_-]{20,}/g },
  { name: "private-key", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
];

export function scanText(path, content, policy = {}) {
  const findings = [];
  for (const pattern of SECRET_PATTERNS) {
    const matches = content.match(pattern.re) ?? [];
    for (const match of matches) {
      findings.push({ path, type: "secret", rule: pattern.name, sample: match.slice(0, 24) });
    }
  }

  for (const term of policy.protectedTerms ?? []) {
    if (term && content.includes(term)) {
      findings.push({ path, type: "protected-term", rule: "operator-protected-term" });
    }
  }

  return findings;
}

export function evaluatePreflight(files, policy = {}) {
  const protectedTerms = policy.protectedTerms ?? [];
  const findings = [];

  if (policy.requireProtectedTerms === true && protectedTerms.length === 0) {
    findings.push({
      path: "<policy>",
      type: "policy",
      rule: "protected-terms-required"
    });
  }

  findings.push(...files.flatMap((file) => scanText(file.path, file.content, { protectedTerms })));

  return {
    ok: findings.length === 0,
    findings
  };
}
