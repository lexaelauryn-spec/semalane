export { SemaLaneState } from "./durable.js";
export { ArtifactPushWorkflow } from "./workflow.js";

import { renderControlRoom } from "./control-room.js";
import { inspectArtifactsAccess, materializeCompositionRepo } from "./live-composition.js";
import { requireOperator } from "./operator-auth.js";
import { buildDemoContracts } from "./demo-seed.js";
import { materializeDemoTasks } from "./demo-live.js";

function json(body, status = 200) { return Response.json(body, { status }); }
function stateStub(env) { return env.SEMALANE_STATE.getByName("global"); }
async function stateFetch(env, path, init = {}) { return stateStub(env).fetch(`https://semalane.internal${path}`, init); }
async function stateJson(env, path) {
  const response = await stateFetch(env, path);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
async function withRepo(env, name, fn) {
  const repo = await env.ARTIFACTS.get(name);
  try { return await fn(repo); }
  finally { if (typeof repo?.[Symbol.dispose] === "function") repo[Symbol.dispose](); }
}

async function createTaskFork(env, baseline, contractId) {
  return withRepo(env, baseline, async (repo) => {
    const name = `task-${contractId.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;
    const forked = await repo.fork(name, {
      description: `SemaLane isolated task fork for ${contractId}`,
      defaultBranchOnly: true,
      readOnly: false
    });
    return { name: forked.name, repoName: forked.name, remote: forked.remote, defaultBranch: forked.defaultBranch };
  });
}

async function seedDemo(env) {
  if (env.SEMALANE_DEMO_MODE !== "1") throw new Error("demo seeding is disabled");
  const contracts = await buildDemoContracts();
  const results = [];
  for (const contract of contracts) {
    const response = await stateFetch(env, "/contracts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(contract)
    });
    results.push({ id: contract.id, status: response.status, body: await response.json() });
  }
  return results;
}


async function runDemoMaterialization(env) {
  if (env.SEMALANE_DEMO_MODE !== "1") throw new Error("demo materialization is disabled");
  const before = await stateJson(env, "/snapshot");

  const materialized = await materializeDemoTasks(
    env,
    before.contracts,
    async (contractId, artifact) => {
      const response = await stateFetch(env, "/artifacts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contractId, artifact })
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    }
  );

  const after = await stateJson(env, "/snapshot");
  const evidenceIds = new Set((after.evidence ?? []).map((item) => item.id));

  for (const contract of after.contracts ?? []) {
    if (contract.state !== "active" || !contract.artifact?.repoName) continue;
    const evidence = [
      {
        id: `LIVE-TEST-${contract.id}`,
        contractId: contract.id,
        kind: "test",
        outcome: "passed",
        summary: "bounded synthetic task validation passed"
      },
      {
        id: `LIVE-REVIEW-A-${contract.id}`,
        contractId: contract.id,
        kind: "review",
        outcome: "approved",
        reviewerId: `reviewer-a-${contract.id}`,
        summary: "independent reviewer A approved observable behavior"
      },
      {
        id: `LIVE-REVIEW-B-${contract.id}`,
        contractId: contract.id,
        kind: "review",
        outcome: "approved",
        reviewerId: `reviewer-b-${contract.id}`,
        summary: "independent reviewer B approved observable behavior"
      }
    ];

    for (const item of evidence) {
      if (evidenceIds.has(item.id)) continue;
      const response = await stateFetch(env, "/evidence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(item)
      });
      if (!response.ok) throw new Error(await response.text());
      evidenceIds.add(item.id);
    }
  }

  return materialized;
}



export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({
          ok: true,
          service: "semalane",
          state: "durable-object",
          eventing: "artifact-push-workflow",
          privacy: "work-contracts-not-minds"
        });
      }

      if (request.method === "GET" && url.pathname === "/cloudflare/preflight") {
        await requireOperator(request, env);
        return json(await inspectArtifactsAccess(env));
      }

      const reads = {
        "/state": "/snapshot",
        "/graph": "/graph",
        "/merge-plan": "/merge-plan",
        "/composition": "/composition",
        "/futures": "/futures",
        "/resolutions": "/resolutions",
        "/relay": "/relay",
        "/agents": "/agents"
      };
      if (request.method === "GET" && reads[url.pathname]) return stateFetch(env, reads[url.pathname]);

      if (request.method === "GET" && url.pathname === "/control-room") {
        const [snapshot, composition] = await Promise.all([
          stateJson(env, "/snapshot"),
          stateJson(env, "/composition")
        ]);
        return new Response(renderControlRoom(snapshot, composition), {
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      }

      if (request.method === "POST" && url.pathname === "/composition/materialize") {
        await requireOperator(request, env);
        const composition = await stateJson(env, "/composition");
        return json(await materializeCompositionRepo(env, composition), 201);
      }

      if (request.method === "POST" && url.pathname === "/demo/seed") {
        await requireOperator(request, env);
        return json({ seeded: await seedDemo(env) }, 201);
      }

      if (request.method === "POST" && ["/demo/materialize-tasks", "/demo/materialize"].includes(url.pathname)) {
        await requireOperator(request, env);
        return json({ materialized: await runDemoMaterialization(env) }, 201);
      }

      if (request.method === "POST" && ["/contracts","/evidence","/events/artifacts","/contracts/complete","/contracts/merged","/relay","/agents","/agents/resume","/agents/idle"].includes(url.pathname)) {
        await requireOperator(request, env);
        const target = {
          "/contracts": "/contracts",
          "/evidence": "/evidence",
          "/events/artifacts": "/events",
          "/contracts/complete": "/complete",
          "/contracts/merged": "/merged",
          "/relay": "/relay",
          "/agents": "/agents",
          "/agents/resume": "/agents/resume",
          "/agents/idle": "/agents/idle"
        }[url.pathname];
        return stateFetch(env, target, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: await request.text()
        });
      }

      if (request.method === "POST" && url.pathname === "/forks") {
        await requireOperator(request, env);
        const body = await request.json();
        if (!body?.baseline || !body?.contractId) {
          return json({ error: "baseline and contractId are required" }, 400);
        }
        const artifact = await createTaskFork(env, body.baseline, body.contractId);
        const stateResponse = await stateFetch(env, "/artifacts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ contractId: body.contractId, artifact })
        });
        if (!stateResponse.ok) return stateResponse;
        return json(artifact, 201);
      }

      return json({ error: "not found" }, 404);
    } catch (error) {
      const status = Number(error?.status ?? 400);
      return json({ error: error instanceof Error ? error.message : "unknown error" }, status);
    }
  }
};
