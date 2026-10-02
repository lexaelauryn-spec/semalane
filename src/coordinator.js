import { validateEvidence, validateWorkContract } from "./protocol.js";
import { detectContractConflict } from "./conflict.js";
import { buildEvidenceGraph, buildMergePlan } from "./evidence-graph.js";
import { buildCompositionPlan, markMerged as markMergedSnapshot } from "./composition.js";
import { buildResolutionTickets } from "./resolution.js";

export class SemaLaneCoordinator {
  constructor(snapshot = {}) {
    this.contracts = new Map((snapshot.contracts ?? []).map((item) => [item.id, item]));
    this.evidence = new Map((snapshot.evidence ?? []).map((item) => [item.id, item]));
    this.events = new Map((snapshot.events ?? []).map((item) => [item.id, item]));
    this.compositions = new Map((snapshot.compositions ?? []).map((item) => [item.repoName, item]));
  }

  registerContract(raw) {
    const contract = validateWorkContract(raw);
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

  assignArtifact(id, artifact) {
    const contract = this.contracts.get(id);
    if (!contract) throw new Error("unknown contract");
    const next = { ...contract, artifact: { ...(contract.artifact ?? {}), ...artifact } };
    this.contracts.set(id, next);
    return structuredClone(next);
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
      compositions: [...this.compositions.values()].map((item) => structuredClone(item))
    };
  }

  graph() { return buildEvidenceGraph(this.snapshot()); }
  mergePlan() { return buildMergePlan(this.snapshot()); }
  compositionPlan(policy = {}) { return buildCompositionPlan(this.snapshot(), policy); }
  resolutions() { return buildResolutionTickets(this.snapshot()); }
}
