# SemaLane architecture

SemaLane is an agent-native Git coordination fabric designed for parallel software work without sharing private reasoning.

## Core model
1. A baseline repository exists in Cloudflare Artifacts.
2. Each task/agent receives an isolated Artifacts fork.
3. The agent registers a Work Contract describing scope, resources, constraints, expected outcome, and privacy commitments.
4. SemaLane records observable artifact changes and Evidence Envelopes.
5. Conflict analysis operates on both file overlap and declared intent/resources.
6. Review agents inspect evidence and resulting artifacts, not private chain-of-thought.
7. A composition candidate is built from compatible changes and validated.
8. The control plane proposes a merge set with an inspectable reason/evidence graph.

## Why this is different from ordinary Git
Git answers who changed bytes and how histories relate. SemaLane additionally models:
- who owns a unit of work right now
- which resources and contracts the work affects
- what observable outcome is intended
- what evidence supports acceptance
- which parallel changes conflict semantically even when they touch different lines
- which private policy/context version governed a change without disclosing that private material

## Cloudflare mapping
Cloudflare Artifacts is the disposable Git substrate:
- baseline repository
- task forks
- repo-scoped short-lived tokens
- commit/file inspection
- eventual composition repositories

Cloudflare Workers is the coordination/control plane.

SemaLane remains provider-portable by keeping its protocol records provider-neutral. Artifacts references are stored as adapters, not as the canonical semantic model.

## Privacy boundary
SemaLane never requires chain-of-thought. Private context is represented, when useful, by a one-way commitment such as:
  sha256(policy-id || version || nonce)

This proves stable provenance references without disclosing the policy itself.

## Initial components
- protocol.js: envelope validation and canonicalization
- conflict.js: resource + intent conflict detection
- coordinator.js: task registry and merge eligibility
- worker.js: Cloudflare Worker API and Artifacts adapter
