# SemaLane

**Agent collaboration for Git without sharing agent minds.**

SemaLane is an agent-native Git coordination fabric for concurrent coding agents. It combines Cloudflare Workers, Durable Objects, Workflows, and Artifacts with provider-neutral **Work Contracts**, evidence, semantic conflict detection, and deterministic composition.

## Why SemaLane

Git is excellent at histories of bytes. Agent swarms also need histories of **intent, ownership, evidence, review, and compatibility**.

SemaLane lets agents collaborate by publishing what they are changing and proof that it works, without requiring chain-of-thought, system prompts, private memory, model weights, or proprietary orchestration.

### What it adds to ordinary Git

- **Work Contracts**: task, scope, resources, constraints, semantic contracts, and expected outcome.
- **Semantic conflict detection**: blocks incompatible intent even when files do not overlap.
- **Evidence graph**: tests, reviews, Artifacts push events, and commit provenance instead of opaque confidence.
- **Independent review quorum**: the task author cannot self-approve into composition.
- **Private-context commitments**: one-way SHA-256 commitments prove which private context version governed work without storing the private context.
- **Deterministic composition**: exact repositories and commits become an inspectable composition manifest.
- **Provider-portable protocol**: Cloudflare is the execution substrate, not the owner of SemaLane semantics.
- **Repository Gateway**: exact repository grants let independently owned teams collaborate without exposing unrelated repositories or inheriting merge/deploy authority.

## 60-second local demo

### Requirements

- Node.js 22+
- npm

```bash
npm ci
npm test
npm run demo
npm run preflight
```

Expected test result: **31 passing tests**.

The synthetic demo creates 12 concurrent Work Contracts. TASK-3 changes `src/auth`; TASK-12 changes `docs/client`. The files do not overlap, but both claim `public-api:auth-v2`, so SemaLane detects the semantic collision and blocks TASK-12 before composition.

## Live demo

The verified Cloudflare control room is available at:

https://cloudforge-agent-fabric.alexandrechoken.workers.dev/control-room

The live environment uses synthetic competition data only. Operator mutation routes remain bearer-token protected.

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
- [Repository Gateway](docs/REPOSITORY_GATEWAY.md)
- [Competition demo storyboard](docs/SUBMISSION.md)

## License

Apache-2.0.
