# Live Cloudflare integration

SemaLane has been exercised end-to-end on Cloudflare Workers + Artifacts with synthetic demo data.

## Architecture boundary

Cloudflare Artifacts has two roles.

### Control plane

The Workers binding handles repository lifecycle, listing/inspection, short-lived repo tokens, and event integration.

### Git data plane

SemaLane uses `isomorphic-git` with an in-memory filesystem to create and push task results and composition manifests over Git. Credentials are not returned by the public protocol or persisted in coordination state.

## Verified live proof

The live demonstration completed the following:

- 12 synthetic Work Contracts registered.
- TASK-1 through TASK-11 completed with real Artifacts repositories and observed commit IDs.
- TASK-12 remained blocked because it and TASK-3 claimed the same semantic contract, `public-api:auth-v2`, despite editing different paths.
- 33 evidence records persisted: one passing test and two independent reviewer approvals for each completed task.
- 12 real Artifacts push events reached Durable Object state.
- A deterministic composition repository was materialized from 11 exact source commits.
- The composition Workflow completed successfully.
- Composition provenance validation returned `valid: true`, with zero missing source commits.
- Unauthorized operator access returned HTTP 401; authorized Artifacts preflight returned HTTP 200.
- The control room rendered the 12-agent state and semantic conflict.

## Real integration bug found during the run

Cloudflare's direct Artifacts event includes `metadata.eventTimestamp`, while the Workflow-delivered payload can omit that metadata wrapper and expose the Workflow timestamp separately.

SemaLane now hydrates only the missing timestamp from the Cloudflare Workflow event timestamp. It does **not** reconstruct private author context or hidden agent reasoning. A regression test covers this exact live failure mode.

## Operator-authenticated routes

The following require `SEMALANE_OPERATOR_TOKEN` and a matching Bearer token:

- `GET /cloudflare/preflight`
- `POST /forks`
- `POST /composition/materialize`
- `POST /demo/seed`
- `POST /demo/materialize-tasks`
- all direct mutation routes

If the secret is absent, operator writes fail closed.

## Composition materialization

`POST /composition/materialize`:

1. reads the authoritative composition plan from Durable Object state;
2. creates or resumes the deterministic Artifacts composition repository;
3. writes `semalane-composition.json` containing only public source repository names and exact commits;
4. commits and pushes the manifest through Git;
5. lets the Workflow validate that every declared source commit exists.

Private context openings, credentials, and agent reasoning are never written to the composition repository.
