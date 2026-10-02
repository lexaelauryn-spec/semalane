import git from "isomorphic-git";
import http from "isomorphic-git/http/web";
import { MemoryFS } from "./memory-fs.js";

function tokenSecret(token) {
  return String(token).split("?expires=")[0];
}

function authFor(token) {
  return () => ({
    username: "x",
    password: tokenSecret(token)
  });
}

export function buildDemoResult(contract) {
  return {
    protocol: "agent-fabric-demo-result-v1",
    contractId: contract.id,
    agentId: contract.agentId,
    task: contract.task,
    expectedOutcome: contract.expectedOutcome,
    constraints: contract.constraints,
    contextCommitment: contract.contextCommitment ? {
      algorithm: contract.contextCommitment.algorithm,
      domain: contract.contextCommitment.domain,
      scope: contract.contextCommitment.scope,
      version: contract.contextCommitment.version,
      commitment: contract.contextCommitment.commitment
    } : null
  };
}

export function demoRepoName(contract) {
  return `task-${contract.id.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;
}

export async function createDemoRepo(env, contract, name = demoRepoName(contract)) {
  return env.ARTIFACTS.create(name, {
    description: `Agent Fabric isolated task result for ${contract.id}`,
    readOnly: false,
    setDefaultBranch: "main"
  });
}

export async function pushDemoRepo(created, contract) {
  const fs = new MemoryFS();
  const dir = "/workspace";
  await git.init({ fs, dir, defaultBranch: "main" });

  await fs.promises.writeFile(
    `${dir}/agent-result.json`,
    JSON.stringify(buildDemoResult(contract), null, 2) + "\n"
  );
  await fs.promises.writeFile(
    `${dir}/README.md`,
    `# Agent task ${contract.id}\n\nThis repository contains the bounded public result for ${contract.agentId}.\n`
  );

  for (const filepath of ["agent-result.json", "README.md"]) {
    await git.add({ fs, dir, filepath });
  }

  const commit = await git.commit({
    fs,
    dir,
    message: `Complete ${contract.id}`,
    author: {
      name: contract.agentId,
      email: `${contract.agentId}@invalid.example`
    }
  });

  const push = await git.push({
    fs,
    http,
    dir,
    url: created.remote,
    ref: "main",
    onAuth: authFor(created.token)
  });

  return {
    repoName: created.name,
    remote: created.remote,
    defaultBranch: created.defaultBranch,
    localCommit: commit,
    refs: push.refs ?? null
  };
}

async function pushDemoRecoveryCommit(created, contract) {
  const fs = new MemoryFS();
  const dir = "/workspace";

  await git.clone({
    fs,
    http,
    dir,
    url: created.remote,
    ref: "main",
    singleBranch: true,
    depth: 1,
    onAuth: authFor(created.token)
  });

  const filepath = "event-proof.json";
  await fs.promises.writeFile(
    `${dir}/${filepath}`,
    JSON.stringify({
      protocol: "agent-fabric-artifact-event-proof-v1",
      contractId: contract.id,
      agentId: contract.agentId,
      purpose: "re-emit a real Artifacts push after workflow event normalization upgrade",
      emittedAt: new Date().toISOString()
    }, null, 2) + "\n"
  );
  await git.add({ fs, dir, filepath });

  const commit = await git.commit({
    fs,
    dir,
    message: `Emit event proof for ${contract.id}`,
    author: {
      name: contract.agentId,
      email: `${contract.agentId}@invalid.example`
    }
  });

  const push = await git.push({
    fs,
    http,
    dir,
    url: created.remote,
    ref: "main",
    onAuth: authFor(created.token)
  });

  return {
    repoName: created.name,
    remote: created.remote,
    defaultBranch: created.defaultBranch,
    localCommit: commit,
    refs: push.refs ?? null
  };
}

async function existingDemoRepoTarget(env, name) {
  const repo = await env.ARTIFACTS.get(name);
  try {
    const info = await repo.info();
    const history = await repo.log({ ref: "main", limit: 1 });
    const minted = await repo.createToken("write", 300);

    return {
      hasHistory: history.length > 0,
      currentCommit: history[0]?.hash ?? history[0]?.id ?? history[0]?.commit ?? null,
      created: {
        name,
        remote: info.remote,
        defaultBranch: info.defaultBranch ?? "main",
        token: minted.plaintext
      }
    };
  } finally {
    if (typeof repo?.[Symbol.dispose] === "function") repo[Symbol.dispose]();
  }
}

export async function materializeDemoTasks(env, contracts, assignArtifact) {
  const results = [];

  for (const contract of contracts) {
    if (contract.state !== "active" || contract.artifact?.commit) continue;

    const name = contract.artifact?.repoName ?? demoRepoName(contract);
    let target;

    if (contract.artifact?.repoName) {
      target = await existingDemoRepoTarget(env, name);
    } else {
      const created = await createDemoRepo(env, contract, name);
      await assignArtifact(contract.id, { repoName: name });
      target = {
        hasHistory: false,
        currentCommit: null,
        created
      };
    }

    const pushed = target.hasHistory
      ? await pushDemoRecoveryCommit(target.created, contract)
      : await pushDemoRepo(target.created, contract);

    results.push({
      contractId: contract.id,
      repoName: pushed.repoName,
      status: target.hasHistory ? "recovery-pushed" : "pushed",
      previousCommit: target.currentCommit,
      commit: pushed.localCommit
    });
  }

  return results;
}
