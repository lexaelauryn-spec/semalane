# SemaLane

**Agent collaboration for Git without sharing agent minds.**

SemaLane is an agent-native Git coordination fabric for concurrent coding agents. It combines Cloudflare Workers, Durable Objects, Workflows, and Artifacts with provider-neutral **Work Contracts**, evidence, semantic conflict detection, and deterministic composition.

## Why SemaLane

Git is excellent at histories of bytes. Agent swarms also need histories of **intent, ownership, evidence, review, and compatibility**.

SemaLane lets agents collaborate by publishing what they are changing and proof that it works, without requiring chain-of-thought, system prompts, private memory, model weights, or proprietary orchestration.

### What it adds to ordinary Git

- **Mission Contracts**: humans state the objective, boundaries, and success criteria once.
- **Resident agents**: stable project roles go idle and resume by reconstructing continuity from observable state.
- **Verified Relay**: typed handoffs record received, verified, changed, leaving, and recommended state.
- **Separation of powers**: read, write, review, and promotion authority are independently bounded.
- **Work Contracts**: task, scope, resources, constraints, semantic contracts, and expected outcome.
- **Semantic conflict detection**: blocks incompatible intent even when files do not overlap.
- **Evidence graph**: tests, reviews, Artifacts push events, and commit provenance instead of opaque confidence.
- **Independent review quorum**: the task author cannot self-approve into composition.
- **Private-context commitments**: one-way SHA-256 commitments prove which private context version governed work without storing the private context.
- **Candidate futures**: safe-now and blocked counterfactual compositions expose exactly what evidence or conflict resolution would unlock another future.
- **Deterministic composition**: exact repositories and commits become an inspectable composition manifest.
- **Provider-portable protocol**: Cloudflare is the execution substrate, not the owner of SemaLane semantics.

## 60-second local demo

### Requirements

- Node.js 22+
- npm

```bash
npm ci
npm test
npm run demo
npm run preflight:public
```

The validation suite covers protocol privacy, verified relay, resident-agent lifecycle, separation of powers, semantic conflict detection, candidate futures, deterministic composition, operator auth, and the judge-facing control room. Run `npm test` for the current count.

`npm run preflight:public` is the judge-reproducible, non-secret repository validation path. It still checks the permissive license, README formatting, and generic secret patterns, but it does not claim to apply XAELL's private protected-term policy. The secret-backed contest clearance remains `npm run preflight`; CI and the contest preview supply `SEMALANE_PROTECTED_TERMS` privately and fail closed when that policy is absent.

The synthetic demo creates 12 concurrent Work Contracts. TASK-3 changes `src/auth`; TASK-12 changes `docs/client`. The files do not overlap, but both claim `public-api:auth-v2`, so SemaLane detects the semantic collision and blocks TASK-12 before composition.

## Contest demo

The isolated contest deployment is not yet recorded as the final verified demo. The previous `cloudforge-agent-fabric` endpoint is legacy and is **not** the contest demo.

Record the final contest Control Room URL here only after the manual `semalane-contest-demo` deployment is deliberately run and verified against the pre-submission gate.

Any verified contest environment must use synthetic competition data only, and operator mutation routes remain bearer-token protected.

## Cloudflare deployment

Live deployment requires a Cloudflare Workers Paid account with Artifacts enabled.

1. Authenticate Cloudflare tooling.
2. Create an Artifacts namespace named `semalane`.
3. Deploy the Worker from this repository.
4. Set `SEMALANE_OPERATOR_TOKEN` as a Worker secret before using operator mutation routes.

```bash
npx wrangler deploy --dry-run
npx wrangler deploy
npx wrangler secret put SEMALANE_OPERATOR_TOKEN
```

The checked-in `wrangler.jsonc` binds:

- `SEMALANE_STATE` → SQLite-backed Durable Object
- `ARTIFACT_PUSH` → Cloudflare Workflow
- `ARTIFACTS` → Artifacts namespace `semalane`
- `SEMALANE_DEMO_MODE` → bounded synthetic demo enablement

## API surface

### Public/read-only

- `GET /health`
- `GET /state`
- `GET /graph`
- `GET /merge-plan`
- `GET /composition`
- `GET /resolutions`
- `GET /control-room`

### Operator-authenticated

- `GET /cloudflare/preflight`
- `POST /demo/seed`
- `POST /demo/materialize-tasks`
- `POST /composition/materialize`
- `POST /missions`
- `POST /agents`
- `POST /agents/resume`
- `POST /agents/idle`
- `POST /relay`
- `POST /contracts`
- `POST /evidence`
- `POST /events/artifacts`
- `POST /contracts/complete`
- `POST /contracts/merged`
- `POST /forks`

Mutation routes fail closed when the operator secret is absent or incorrect.

## Privacy model

SemaLane exchanges **work contracts and evidence, not minds**.

The public protocol carries bounded observable artifacts only: task identity, scope, resource/semantic claims, public commitment hashes, repository/commit provenance, test/reviewer evidence, conflict facts, and composition validation.

See:

- [Architecture](docs/ARCHITECTURE.md)
- [Public / private boundary](docs/PUBLIC_PRIVATE_BOUNDARY.md)
- [Live Cloudflare integration](docs/LIVE_INTEGRATION.md)
- [Competition demo storyboard](docs/SUBMISSION.md)
- [Demo recording script](docs/DEMO_SCRIPT.md)
- [Application draft](docs/APPLICATION_DRAFT.md)
- [Pre-submission gate](docs/PRE_SUBMISSION_GATE.md)

## License

Apache-2.0.
