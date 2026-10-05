import { validateEvidence, validateWorkContract } from "./protocol.js";
import { validateHandoff, validateRelayRecord } from "./relay.js";
import { idleResidentAgent, resumeResidentAgent, validateResidentAgent } from "./resident-agent.js";
import { authorizeAgentAction } from "./authority.js";
import { detectContractConflict } from "./conflict.js";
import { buildEvidenceGraph, buildMergePlan } from "./evidence-graph.js";
import { buildCompositionPlan, markMerged as markMergedSnapshot } from "./composition.js";
import { buildResolutionTickets } from "./resolution.js";
import { buildCandidateFutures } from "./futures.js";
import { validateMissionContract } from "./mission.js";

export class SemaLaneCoordinator {
  constructor(snapshot = {}) {
    this.contracts = new Map((snapshot.contracts ?? []).map((item) => [item.id, item]));
    this.evidence = new Map((snapshot.evidence ?? []).map((item) => [item.id, item]));
    this.events = new Map((snapshot.events ?? []).map((item) => [item.id, item]));
    this.compositions = new Map((snapshot.compositions ?? []).map((item) => [item.repoName, item]));
    this.relay = new Map((snapshot.relay ?? []).map((item) => [item.id, item]));
    this.agents = new Map((snapshot.agents ?? []).map((item) => [item.id, item]));
    this.missions = new Map((snapshot.missions ?? []).map((item) => [item.id, item]));
  }

  registerMission(raw) {
    const mission = validateMissionContract(raw);
    if (this.missions.has(mission.id)) throw new Error("mission id already exists");
    this.missions.set(mission.id, mission);
    return structuredClone(mission);
  }

  registerContract(raw) {
    const contract = validateWorkContract(raw);
    if (contract.missionId && !this.missions.has(contract.missionId)) throw new Error("unknown mission");
    if (this.contracts.has(contract.id)) throw new Error("contract id already exists");

    const conflicts = [];
    for (const existing of this.contracts.values()) {
      if (existing.state === "merged" || existing.state === "cancelled") continue;
      const result = detectContractConflict(existing, contract);
      if (result.conflict) conflicts.push({ with: existing.id, reasons: result.reasons });
    }

    const stored = { ...contract, state: conflicts.length ? "blocked" : "active", conflicts };
    this.contracts.set(stored.id, stored);
    return structuredClone(stored);
  }

  registerResidentAgent(raw) {
    const agent = validateResidentAgent(raw);
    if (this.agents.has(agent.id)) throw new Error("resident agent id already exists");
    this.agents.set(agent.id, agent);
    return structuredClone(agent);
  }

  resumeAgent(id, resume) {
    const agent = resumeResidentAgent(this.agents.get(id), resume);
    this.agents.set(id, agent);
    return structuredClone(agent);
  }

  idleAgent(id, idle) {
    if (!this.relay.has(idle?.handoffId)) throw new Error("resident agent cannot idle without a recorded handoff");
    const handoff = this.relay.get(idle.handoffId);
    if (handoff.kind !== "HANDOFF" || handoff.agentId !== id) throw new Error("handoff does not belong to resident agent");
    const agent = idleResidentAgent(this.agents.get(id), idle);
    this.agents.set(id, agent);
    return structuredClone(agent);
  }

  recordRelay(raw) {
    const record = raw?.kind === "HANDOFF" ? validateHandoff(raw) : validateRelayRecord(raw);
    if (!this.contracts.has(record.contractId)) throw new Error("relay targets unknown contract");
    if (!this.agents.has(record.agentId)) throw new Error("relay author is not a registered resident agent");
    if (record.recipientAgentId && !this.agents.has(record.recipientAgentId)) throw new Error("relay recipient is not a registered resident agent");
    if (record.supersedes && !this.relay.has(record.supersedes)) throw new Error("relay supersedes unknown record");
    if (this.relay.has(record.id)) throw new Error("relay id already exists");
    this.relay.set(record.id, record);
    return structuredClone(record);
  }

  assignArtifact(id, artifact) {
    const contract = this.contracts.get(id);
    if (!contract) throw new Error("unknown contract");
    const next = { ...contract, artifact: { ...(contract.artifact ?? {}), ...artifact } };
    this.contracts.set(id, next);
    return structuredClone(next);
  }

  agentAttachEvidence(agentId, raw) {
    const agent = this.agents.get(agentId);
    const contract = this.contracts.get(raw?.contractId);
    authorizeAgentAction(agent, "review:evidence", { contract });
    if (raw?.kind !== "review") throw new Error("agent review boundary accepts review evidence only");
    if (raw.reviewerId && raw.reviewerId !== agentId) throw new Error("reviewerId must match acting resident agent");
    return this.attachEvidence({ ...raw, reviewerId: agentId });
  }

  agentMarkMerged(agentId, contractIds) {
    const agent = this.agents.get(agentId);
    const contracts = contractIds.map((id) => this.contracts.get(id)).filter(Boolean);
    if (contracts.length !== contractIds.length) throw new Error("unknown contract");
    authorizeAgentAction(agent, "promote:composition", { contracts });
    return this.markMerged(contractIds);
  }

  attachEvidence(raw) {
    const evidence = validateEvidence(raw);
    if (!this.contracts.has(evidence.contractId)) throw new Error("unknown contract");
    if (this.evidence.has(evidence.id)) throw new Error("evidence id already exists");
    this.evidence.set(evidence.id, evidence);
    return structuredClone(evidence);
  }

  ingestEvent(event) {
    if (this.events.has(event.id)) return structuredClone(this.events.get(event.id));
    let contractId = null;
    for (const contract of this.contracts.values()) {
      if (contract.artifact?.repoName === event.repoName) {
        contractId = contract.id;
        if (event.commit) {
          this.assignArtifact(contract.id, {
            commit: event.commit,
            ref: event.ref,
            lastPushAt: event.observedAt
          });
        }
        break;
      }
    }
    const stored = { ...event, contractId };
    this.events.set(stored.id, stored);
    return structuredClone(stored);
  }

  recordCompositionValidation(validation) {
    if (!validation?.repoName) throw new Error("composition validation must name a repository");
    const stored = {
      ...validation,
      recordedAt: new Date().toISOString()
    };
    this.compositions.set(stored.repoName, stored);
    return structuredClone(stored);
  }

  completeContract(id) {
    const contract = this.contracts.get(id);
    if (!contract) throw new Error("unknown contract");
    if (contract.state === "blocked") throw new Error("blocked contract cannot complete");
    if (!contract.artifact?.commit) throw new Error("contract cannot complete without an observed artifact commit");
    const next = { ...contract, state: "completed" };
    this.contracts.set(id, next);
    return structuredClone(next);
  }

  markMerged(contractIds) {
    const updated = markMergedSnapshot(this.snapshot(), contractIds);
    this.contracts = new Map(updated.contracts.map((item) => [item.id, item]));
    return contractIds.map((id) => structuredClone(this.contracts.get(id))).filter(Boolean);
  }

  snapshot() {
    return {
      contracts: [...this.contracts.values()].map((item) => structuredClone(item)),
      evidence: [...this.evidence.values()].map((item) => structuredClone(item)),
      events: [...this.events.values()].map((item) => structuredClone(item)),
      compositions: [...this.compositions.values()].map((item) => structuredClone(item)),
      relay: [...this.relay.values()].map((item) => structuredClone(item)),
      agents: [...this.agents.values()].map((item) => structuredClone(item)),
      missions: [...this.missions.values()].map((item) => structuredClone(item))
    };
  }

  graph() { return buildEvidenceGraph(this.snapshot()); }
  mergePlan() { return buildMergePlan(this.snapshot()); }
  compositionPlan(policy = {}) { return buildCompositionPlan(this.snapshot(), policy); }

  candidateFutures(policy = {}) { return buildCandidateFutures(this.snapshot(), policy); }
  resolutions() { return buildResolutionTickets(this.snapshot()); }
}
