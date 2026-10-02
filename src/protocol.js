const FORBIDDEN_REASONING_FIELDS = new Set([
  "chainOfThought",
  "chain_of_thought",
  "reasoningTrace",
  "reasoning_trace",
  "systemPrompt",
  "system_prompt",
  "developerPrompt",
  "developer_prompt",
  "privateMemory",
  "private_memory",
  "rawContext",
  "raw_context",
  "privateDescriptor",
  "private_descriptor",
  "nonce"
]);

function assertObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
}

function assertString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

function findForbiddenFields(value, path = "$", found = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbiddenFields(item, `${path}[${index}]`, found));
    return found;
  }
  if (!value || typeof value !== "object") return found;

  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_REASONING_FIELDS.has(key)) found.push(`${path}.${key}`);
    findForbiddenFields(child, `${path}.${key}`, found);
  }
  return found;
}

function validateCommitment(commitment) {
  if (commitment == null) return null;
  assertObject(commitment, "contract.contextCommitment");
  for (const key of ["algorithm", "domain", "scope", "version", "commitment"]) {
    assertString(commitment[key], `contract.contextCommitment.${key}`);
  }
  if (commitment.algorithm !== "SHA-256") throw new Error("unsupported commitment algorithm");
  if (commitment.domain !== "SEMALANE-CONTEXT-COMMITMENT-V1") throw new Error("unsupported commitment domain");
  if (!/^[a-f0-9]{64}$/i.test(commitment.commitment)) throw new Error("commitment digest must be 64 hex characters");
  return { ...commitment };
}

export function validatePrivacyBoundary(envelope) {
  const forbidden = findForbiddenFields(envelope);
  if (forbidden.length) {
    throw new Error(`private reasoning fields are forbidden: ${forbidden.join(", ")}`);
  }
  return true;
}

export function validateWorkContract(contract) {
  assertObject(contract, "contract");
  validatePrivacyBoundary(contract);
  for (const key of ["id", "agentId", "task", "expectedOutcome"]) {
    assertString(contract[key], `contract.${key}`);
  }
  if (!Array.isArray(contract.resources)) throw new TypeError("contract.resources must be an array");
  if (!Array.isArray(contract.paths)) throw new TypeError("contract.paths must be an array");
  return {
    ...contract,
    resources: [...new Set(contract.resources)].sort(),
    paths: [...new Set(contract.paths)].sort(),
    constraints: Array.isArray(contract.constraints) ? [...contract.constraints] : [],
    contextCommitment: validateCommitment(contract.contextCommitment)
  };
}

export function validateEvidence(evidence) {
  assertObject(evidence, "evidence");
  validatePrivacyBoundary(evidence);
  for (const key of ["id", "contractId", "kind", "summary"]) {
    assertString(evidence[key], `evidence.${key}`);
  }
  return {
    ...evidence,
    refs: Array.isArray(evidence.refs) ? [...evidence.refs] : []
  };
}
