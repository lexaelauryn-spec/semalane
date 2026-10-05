const WRITE_CAPABILITIES = new Set(["write:task-fork"]);
const REVIEW_CAPABILITIES = new Set(["review:evidence"]);
const PROMOTION_CAPABILITIES = new Set(["promote:composition"]);

function intersects(set, capabilities) {
  return capabilities.some((item) => set.has(item));
}

export function validateCapabilitySeparation(capabilities) {
  const values = [...new Set(capabilities ?? [])];
  const writes = intersects(WRITE_CAPABILITIES, values);
  const reviews = intersects(REVIEW_CAPABILITIES, values);
  const promotes = intersects(PROMOTION_CAPABILITIES, values);
  if ((writes && reviews) || (writes && promotes) || (reviews && promotes)) {
    throw new Error("separation of powers forbids combining write, review, and promotion authority");
  }
  return values.sort();
}

export function authorizeAgentAction(agent, action, context = {}) {
  if (!agent) throw new Error("unknown resident agent");
  if (agent.state !== "active") throw new Error("resident agent must be active");
  if (!agent.capabilities?.includes(action)) {
    throw new Error("resident agent is missing capability: " + action);
  }

  if (action === "review:evidence") {
    const contract = context.contract;
    if (!contract) throw new Error("review authorization requires a contract");
    if (contract.agentId === agent.id) throw new Error("agent cannot review its own work");
  }

  if (action === "promote:composition") {
    const contracts = context.contracts ?? [];
    if (contracts.some((contract) => contract.agentId === agent.id)) {
      throw new Error("agent cannot promote its own work");
    }
  }

  return true;
}
