import { DurableObject } from "cloudflare:workers";
import { SemaLaneCoordinator } from "./coordinator.js";
import { normalizeArtifactEvent } from "./artifact-events.js";

const STATE_KEY = "semalane-state-v1";
const DEFAULT_POLICY = { review: { requiredReviewers: 2, requireSecurityEvidence: false } };

function response(body, status = 200) { return Response.json(body, { status }); }

export class SemaLaneState extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
  }

  async load() { return new SemaLaneCoordinator((await this.ctx.storage.get(STATE_KEY)) ?? {}); }
  async save(coordinator) { await this.ctx.storage.put(STATE_KEY, coordinator.snapshot()); }

  async fetch(request) {
    const url = new URL(request.url);
    const coordinator = await this.load();

    try {
      if (request.method === "GET" && url.pathname === "/snapshot") return response(coordinator.snapshot());
      if (request.method === "GET" && url.pathname === "/graph") return response(coordinator.graph());
      if (request.method === "GET" && url.pathname === "/merge-plan") return response(coordinator.mergePlan());
      if (request.method === "GET" && url.pathname === "/composition") return response(coordinator.compositionPlan(DEFAULT_POLICY));
      if (request.method === "GET" && url.pathname === "/futures") return response(coordinator.candidateFutures(DEFAULT_POLICY));
      if (request.method === "GET" && url.pathname === "/resolutions") return response(coordinator.resolutions());
      if (request.method === "GET" && url.pathname === "/relay") return response(coordinator.snapshot().relay ?? []);
      if (request.method === "GET" && url.pathname === "/agents") return response(coordinator.snapshot().agents ?? []);
      if (request.method === "GET" && url.pathname === "/missions") return response(coordinator.snapshot().missions ?? []);

      const body = request.method === "GET" ? null : await request.json();

      if (request.method === "POST" && url.pathname === "/missions") {
        const result = coordinator.registerMission(body); await this.save(coordinator); return response(result, 201);
      }
      if (request.method === "POST" && url.pathname === "/contracts") {
        const result = coordinator.registerContract(body); await this.save(coordinator); return response(result, 201);
      }
      if (request.method === "POST" && url.pathname === "/agents") {
        const result = coordinator.registerResidentAgent(body); await this.save(coordinator); return response(result, 201);
      }
      if (request.method === "POST" && url.pathname === "/agents/resume") {
        const result = coordinator.resumeAgent(body.agentId, body); await this.save(coordinator); return response(result);
      }
      if (request.method === "POST" && url.pathname === "/agents/idle") {
        const result = coordinator.idleAgent(body.agentId, body); await this.save(coordinator); return response(result);
      }
      if (request.method === "POST" && url.pathname === "/relay") {
        const result = coordinator.recordRelay(body); await this.save(coordinator); return response(result, 201);
      }
      if (request.method === "POST" && url.pathname === "/artifacts") {
        const result = coordinator.assignArtifact(body.contractId, body.artifact); await this.save(coordinator); return response(result);
      }
      if (request.method === "POST" && url.pathname === "/evidence") {
        const result = coordinator.attachEvidence(body); await this.save(coordinator); return response(result, 201);
      }
      if (request.method === "POST" && url.pathname === "/events") {
        const result = coordinator.ingestEvent(normalizeArtifactEvent(body)); await this.save(coordinator); return response(result, 201);
      }
      if (request.method === "POST" && url.pathname === "/composition-validation") {
        const result = coordinator.recordCompositionValidation(body); await this.save(coordinator); return response(result, 201);
      }
      if (request.method === "POST" && url.pathname === "/complete") {
        const result = coordinator.completeContract(body.contractId); await this.save(coordinator); return response(result);
      }
      if (request.method === "POST" && url.pathname === "/merged") {
        const ids = Array.isArray(body.contractIds) ? body.contractIds : [];
        const result = coordinator.markMerged(ids); await this.save(coordinator); return response(result);
      }

      return response({ error: "not found" }, 404);
    } catch (error) {
      return response({ error: error instanceof Error ? error.message : "unknown error" }, 400);
    }
  }
}
