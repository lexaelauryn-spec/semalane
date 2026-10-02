import git from "isomorphic-git";
import http from "isomorphic-git/http/web";
import { MemoryFS } from "./memory-fs.js";
import { buildCompositionManifest } from "./composition-manifest.js";

function tokenSecret(token) {
  return String(token).split("?expires=")[0];
}

async function resolveCompositionTarget(env, name) {
  const page = await env.ARTIFACTS.list({ limit: 100 });
  const existing = page.repos.some((repo) => repo.name === name);

  if (!existing) {
    return {
      resumed: false,
      created: await env.ARTIFACTS.create(name, {
        description: "SemaLane validated composition candidate",
        readOnly: false,
        setDefaultBranch: "main"
      })
    };
  }

  const repo = await env.ARTIFACTS.get(name);
  try {
    const info = await repo.info();
    const history = await repo.log({ ref: "main", limit: 1 });

    if (history.length) {
      return {
        resumed: true,
        alreadyMaterialized: true,
        currentCommit: history[0]?.hash ?? history[0]?.id ?? history[0]?.commit ?? null,
        info
      };
    }

    const minted = await repo.createToken("write", 300);
    return {
      resumed: true,
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

export { buildCompositionManifest };

export async function materializeCompositionRepo(env, plan) {
  if (!plan?.compositionRepo?.name || !plan?.accepted?.length) {
    throw new Error("composition plan has no accepted candidates");
  }

  const target = await resolveCompositionTarget(env, plan.compositionRepo.name);
  const manifest = buildCompositionManifest(plan);

  if (target.alreadyMaterialized) {
    return {
      repoName: plan.compositionRepo.name,
      remote: target.info.remote,
      defaultBranch: target.info.defaultBranch ?? "main",
      manifestCommit: target.currentCommit,
      refs: null,
      sourceCount: manifest.sources.length,
      resumed: true,
      alreadyMaterialized: true
    };
  }

  const created = target.created;
  const fs = new MemoryFS();
  const dir = "/workspace";
  await git.init({ fs, dir, defaultBranch: "main" });

  await fs.promises.writeFile(
    `${dir}/semalane-composition.json`,
    JSON.stringify(manifest, null, 2) + "\n"
  );
  await fs.promises.writeFile(
    `${dir}/README.md`,
    "# SemaLane Composition Candidate\n\nThis repository is a composition manifest. Source commits are validated and merged in an isolated CI runner.\n"
  );

  for (const filepath of ["semalane-composition.json", "README.md"]) {
    await git.add({ fs, dir, filepath });
  }

  const commit = await git.commit({
    fs,
    dir,
    message: "Create SemaLane composition candidate",
    author: {
      name: "SemaLane",
      email: "semalane@invalid.example"
    }
  });

  const push = await git.push({
    fs,
    http,
    dir,
    url: created.remote,
    ref: "main",
    onAuth: () => ({
      username: "x",
      password: tokenSecret(created.token)
    })
  });

  return {
    repoName: created.name,
    remote: created.remote,
    defaultBranch: created.defaultBranch,
    manifestCommit: commit,
    refs: push.refs ?? null,
    sourceCount: manifest.sources.length,
    resumed: target.resumed
  };
}

export async function inspectArtifactsAccess(env) {
  const page = await env.ARTIFACTS.list({ limit: 5 });
  return {
    ok: true,
    namespaceReachable: true,
    reposVisible: page.repos.map((repo) => ({
      name: repo.name,
      status: repo.status
    })),
    nextCursorPresent: Boolean(page.cursor)
  };
}
