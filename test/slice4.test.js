import test from "node:test";
import assert from "node:assert/strict";
import git from "isomorphic-git";
import { requireOperator } from "../src/operator-auth.js";
import { buildCompositionManifest } from "../src/composition-manifest.js";
import { buildDemoContracts } from "../src/demo-seed.js";
import { buildDemoResult } from "../src/demo-live.js";
import { MemoryFS } from "../src/memory-fs.js";
import { hydrateArtifactEvent, normalizeArtifactEvent } from "../src/artifact-events.js";

test("operator auth fails closed when no token is configured", async () => {
  const request = new Request("https://semalane.invalid/test");
  await assert.rejects(() => requireOperator(request, {}), /operator writes are disabled/);
});

test("operator auth accepts only the configured bearer token", async () => {
  const env = { SEMALANE_OPERATOR_TOKEN: "test" };
  await requireOperator(new Request("https://semalane.invalid/test", {
    headers: { authorization: "Bearer test" }
  }), env);

  await assert.rejects(() => requireOperator(new Request("https://semalane.invalid/test", {
    headers: { authorization: "Bearer nope" }
  }), env), /operator authorization required/);
});

test("composition manifest exposes exact public provenance only", () => {
  const manifest = buildCompositionManifest({
    protocol: "semalane-composition-v1",
    compositionId: "T1@abc",
    accepted: [{ contractId: "T1" }],
    compositionRepo: {
      strategy: "validate-then-compose",
      sources: [{
        contractId: "T1",
        repoName: "task-t1",
        commit: "abc",
        token: "x",
        privateDescriptor: "private-fixture"
      }]
    }
  });

  assert.deepEqual(manifest.sources, [{
    contractId: "T1",
    repoName: "task-t1",
    commit: "abc"
  }]);
  assert.equal(JSON.stringify(manifest).includes("private-fixture"), false);
});

test("demo seed creates 12 contracts with public commitments and one semantic collision pair", async () => {
  const contracts = await buildDemoContracts();
  assert.equal(contracts.length, 12);
  assert.equal(contracts.every((item) => item.contextCommitment?.commitment?.length === 64), true);
  assert.equal(contracts.some((item) => "privateDescriptor" in item.contextCommitment), false);
  assert.deepEqual(contracts.find((item) => item.id === "TASK-3").contracts, ["public-api:auth-v2"]);
  assert.deepEqual(contracts.find((item) => item.id === "TASK-12").contracts, ["public-api:auth-v2"]);
});


test("mutation routes are operator-gated", async () => {
  const workerSource = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/worker.js", import.meta.url), "utf8")
  );
  for (const route of ["/contracts","/evidence","/events/artifacts","/contracts/complete","/contracts/merged"]) {
    const routeIndex = workerSource.indexOf(route);
    assert.notEqual(routeIndex, -1, `missing route ${route}`);
  }
  const block = workerSource.slice(
    workerSource.indexOf('if (request.method === "POST" && ["/contracts"'),
    workerSource.indexOf('if (request.method === "POST" && url.pathname === "/forks")')
  );
  assert.match(block, /await requireOperator\(request, env\)/);
  const demoMaterializeIndex = workerSource.indexOf('["/demo/materialize-tasks", "/demo/materialize"].includes(url.pathname)');
  assert.notEqual(demoMaterializeIndex, -1, "missing demo materialization aliases");
  const demoBlock = workerSource.slice(demoMaterializeIndex, demoMaterializeIndex + 400);
  assert.match(demoBlock, /await requireOperator\(request, env\)/);
  assert.match(demoBlock, /runDemoMaterialization\(env\)/);
});


test("live demo result exposes only public commitment fields", () => {
  const result = buildDemoResult({
    id: "TASK-X",
    agentId: "agent-x",
    task: "bounded task",
    expectedOutcome: "bounded result",
    constraints: ["no-private-reasoning"],
    contextCommitment: {
      algorithm: "SHA-256",
      domain: "SEMALANE-CONTEXT-COMMITMENT-V1",
      scope: "demo",
      version: "v1",
      commitment: "a".repeat(64),
      privateDescriptor: { hidden: true },
      nonce: "never-export-this"
    }
  });
  assert.equal(result.contextCommitment.commitment.length, 64);
  assert.equal("privateDescriptor" in result.contextCommitment, false);
  assert.equal("nonce" in result.contextCommitment, false);
});


test("MemoryFS satisfies the isomorphic-git promise filesystem contract", async () => {
  const fs = new MemoryFS();
  const dir = "/repo";
  await git.init({ fs, dir, defaultBranch: "main" });
  await fs.promises.writeFile(`${dir}/README.md`, "# test\n");
  await git.add({ fs, dir, filepath: "README.md" });
  const commit = await git.commit({
    fs,
    dir,
    message: "test commit",
    author: { name: "test", email: "test@invalid.example" }
  });
  assert.match(commit, /^[0-9a-f]{40}$/);
});


test("workflow event hydration restores the dropped Artifacts timestamp deterministically", () => {
  const raw = {
    type: "cf.artifacts.repo.pushed",
    source: { namespace: "agent-fabric", repoName: "task-task-1" },
    payload: {
      ref: "refs/heads/main",
      before: "0".repeat(40),
      after: "a".repeat(40),
      commits: [],
      totalCommitsCount: 1
    }
  };
  const hydrated = hydrateArtifactEvent(raw, new Date("2026-10-02T01:15:41.358Z"));
  assert.equal(hydrated.metadata.eventTimestamp, "2026-10-02T01:15:41.358Z");
  assert.equal(raw.metadata, undefined);
  assert.equal(normalizeArtifactEvent(hydrated).commit, "a".repeat(40));
});
