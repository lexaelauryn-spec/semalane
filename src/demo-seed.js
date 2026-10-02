import { createContextCommitment } from "./commitments.js";

export async function buildDemoContracts() {
  const contracts = [];
  for (let n = 1; n <= 12; n += 1) {
    const contextCommitment = await createContextCommitment({
      scope: "demo-agent-policy",
      version: `v${n}`,
      privateDescriptor: { syntheticPolicyEpoch: n },
      nonce: `demo-seed-${String(n).padStart(4, "0")}-0123456789abcdef`
    });

    contracts.push({
      id: `TASK-${n}`,
      agentId: `agent-${String(n).padStart(2, "0")}`,
      task: n === 3 ? "Change auth API implementation" : n === 12 ? "Update auth client documentation" : `Parallel feature lane ${n}`,
      expectedOutcome: `Observable outcome ${n}`,
      resources: n === 3 || n === 12 ? [] : [`service:${n}`],
      paths: n === 3 ? ["src/auth"] : n === 12 ? ["docs/client"] : [`src/lane-${n}`],
      contracts: n === 3 || n === 12 ? ["public-api:auth-v2"] : [`contract:${n}`],
      constraints: ["no-private-reasoning"],
      contextCommitment
    });
  }
  return contracts;
}
