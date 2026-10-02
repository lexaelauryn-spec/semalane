const encoder = new TextEncoder();

function stableSerialize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
}

function toHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createContextCommitment({
  scope,
  version,
  privateDescriptor,
  nonce
}) {
  if (!scope || !version || !nonce) throw new Error("scope, version, and nonce are required");
  if (nonce.length < 16) throw new Error("nonce must be at least 16 characters");

  const canonical = stableSerialize({
    domain: "SEMALANE-CONTEXT-COMMITMENT-V1",
    scope,
    version,
    privateDescriptor,
    nonce
  });

  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(canonical));
  return {
    algorithm: "SHA-256",
    domain: "SEMALANE-CONTEXT-COMMITMENT-V1",
    scope,
    version,
    commitment: toHex(new Uint8Array(digest))
  };
}

export async function verifyContextCommitment(commitment, opening) {
  const recreated = await createContextCommitment(opening);
  return (
    commitment?.algorithm === recreated.algorithm &&
    commitment?.domain === recreated.domain &&
    commitment?.scope === recreated.scope &&
    commitment?.version === recreated.version &&
    commitment?.commitment === recreated.commitment
  );
}
