import test from "node:test";
import assert from "node:assert/strict";
import { validateCompositionRepo } from "../src/composition-validation.js";

function disposableRepo(methods) {
  return { ...methods, [Symbol.dispose]() {} };
}

test("composition validation proves every exact source commit exists", async () => {
  const manifest = {
    protocol: "semalane-composition-v1",
    compositionId: "T1@abc+T2@def",
    sources: [
      { contractId: "T1", repoName: "task-t1", commit: "abc" },
      { contractId: "T2", repoName: "task-t2", commit: "def" }
    ]
  };

  const repos = {
    "compose-t1-t2": disposableRepo({
      async readFile() { return new Blob([JSON.stringify(manifest)]); }
    }),
    "task-t1": disposableRepo({
      async readCommit(hash) { return hash === "abc" ? { hash } : null; }
    }),
    "task-t2": disposableRepo({
      async readCommit(hash) { return hash === "def" ? { hash } : null; }
    })
  };

  const result = await validateCompositionRepo({
    ARTIFACTS: { async get(name) { return repos[name]; } }
  }, "compose-t1-t2");

  assert.equal(result.valid, true);
  assert.equal(result.sourceCount, 2);
  assert.deepEqual(result.missing, []);
});

test("composition validation reports a missing source commit without leaking credentials", async () => {
  const manifest = {
    protocol: "semalane-composition-v1",
    compositionId: "T1@abc",
    sources: [{ contractId: "T1", repoName: "task-t1", commit: "abc", token: "secret" }]
  };

  const repos = {
    "compose-t1": disposableRepo({
      async readFile() { return new Blob([JSON.stringify(manifest)]); }
    }),
    "task-t1": disposableRepo({
      async readCommit() { return null; }
    })
  };

  const result = await validateCompositionRepo({
    ARTIFACTS: { async get(name) { return repos[name]; } }
  }, "compose-t1");

  assert.equal(result.valid, false);
  assert.equal(result.missing[0].commit, "abc");
  assert.equal(JSON.stringify(result).includes("secret"), false);
});
