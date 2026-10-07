# SemaLane Repository Gateway

SemaLane Repository Gateway lets independently owned organizations collaborate across explicitly authorized Git repositories without sharing unrelated repositories, credentials, private agent context, or deployment authority.

## Design goal

A repository connection is a bounded grant, not an account-wide permission.

Each grant identifies:

- the owner that authorized the connection;
- the provider and provider installation;
- the exact repository ID and canonical repository name;
- the exact allowed actions;
- optional expiry or revocation state;
- whether consequence-sensitive actions remain behind an owner gate.

Credential material is never stored in Work Contracts or repository grants.

## Default authority

Repository actions are deny-by-default.

Ordinary collaboration actions may be delegated explicitly:

- `read`
- `create-branch`
- `push-branch`
- `open-pr`
- `update-pr`

The following remain consequence-sensitive even if a repository installation technically permits them:

- `merge`
- `deploy`
- `production-write`
- `secrets-read`
- `secrets-write`
- `admin`

A grant that names one of those actions must declare `ownerGate: true`, and runtime authorization still returns `owner-gate-required` rather than performing the action automatically.

## Provider model

The gateway is provider-neutral. The core recognizes GitHub, GitLab, Forgejo, Gitea, and generic Git as provider identities, while individual adapters are responsible for translating provider-native installation/repository IDs into the normalized grant.

GitHub should use a GitHub App installation rather than a personal access token. The installation owner chooses the repositories exposed to SemaLane, and SemaLane stores only the installation/repository identity required to route an operation. Provider credentials stay in the provider adapter's secret store.

## Work Contract binding

A Work Contract does not inherit every action in a repository grant.

Instead, a repository work binding narrows the grant again:

```json
{
  "contractId": "TASK-DISCORDIAN-MEXIR",
  "grantId": "grant-discordian-platform",
  "provider": "github",
  "repositoryId": "provider-repository-id",
  "repository": "discordianrecords/platform",
  "installationId": "provider-installation-id",
  "actions": ["read", "create-branch", "push-branch", "open-pr"],
  "ownerGateRequired": false
}
```

The binding is rejected if it requests an action not present in the parent grant.

## XAELL ↔ Discordian reference flow

The first intended real-world use is the Discordian/MEXIR integration.

1. XAELL authorizes the exact MEXIR repository needed for the shared integration.
2. Discordian authorizes the exact Discordian repository containing its adapter.
3. SemaLane creates one Work Contract whose semantic contract includes the agreed partner protocol version.
4. SemaLane inspects only the authorized repositories and compares their interface contracts.
5. Each side receives an isolated branch for implementation.
6. Tests, commit SHAs, API-contract evidence, and review results attach to the Work Contract.
7. SemaLane may open/update PRs if that action was granted.
8. Merge, deployment, production writes, secrets, and administrative actions remain owner-controlled unless a separate explicit authority decision permits them.

For the current MEXIR side, the reference partner contract is `2026-10-01.1`. The live MEXIR read adapter and fail-closed write bridge are separate capabilities and must remain distinguishable in evidence.

## Revocation and expiry

A revoked or expired grant immediately fails authorization.

Revoking one repository grant does not revoke another grant owned by the same organization. This is intentional: repository scope is the unit of collaboration authority.

## Security invariants

- Possession of provider credentials does not imply authorization.
- Repository identity is checked by immutable provider repository ID, not name alone.
- Work bindings may narrow authority but never broaden it.
- Secrets and credentials are forbidden inside grants.
- Unknown actions fail validation.
- Consequence-sensitive actions stop at an owner gate.
- Unrelated repositories remain inaccessible unless separately authorized.
- SemaLane exchanges work intent and evidence, not private reasoning or model state.
