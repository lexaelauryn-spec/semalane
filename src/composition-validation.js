function assertManifest(manifest) {
  if (!manifest || typeof manifest !== "object") throw new Error("composition manifest must be an object");
  if (manifest.protocol !== "semalane-composition-v1") throw new Error("unsupported composition protocol");
  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) {
    throw new Error("composition manifest must contain sources");
  }
}

async function withRepo(artifacts, name, fn) {
  const repo = await artifacts.get(name);
  try {
    return await fn(repo);
  } finally {
    if (typeof repo?.[Symbol.dispose] === "function") repo[Symbol.dispose]();
  }
}

export async function validateCompositionRepo(env, repoName, ref = "main") {
  const manifest = await withRepo(env.ARTIFACTS, repoName, async (repo) => {
    const file = await repo.readFile({ ref, path: "semalane-composition.json" });
    if (!file) throw new Error("composition manifest not found");
    return JSON.parse(await file.text());
  });

  assertManifest(manifest);

  const sources = [];
  for (const source of manifest.sources) {
    if (!source?.repoName || !source?.commit || !source?.contractId) {
      throw new Error("composition source is incomplete");
    }

    const exists = await withRepo(env.ARTIFACTS, source.repoName, async (repo) => {
      return Boolean(await repo.readCommit(source.commit));
    });

    sources.push({
      contractId: source.contractId,
      repoName: source.repoName,
      commit: source.commit,
      exists
    });
  }

  const missing = sources.filter((source) => !source.exists);
  return {
    repoName,
    ref,
    protocol: manifest.protocol,
    compositionId: manifest.compositionId ?? null,
    valid: missing.length === 0,
    sourceCount: sources.length,
    sources,
    missing: missing.map((source) => ({
      contractId: source.contractId,
      repoName: source.repoName,
      commit: source.commit
    }))
  };
}
