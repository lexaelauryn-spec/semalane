# PUBLIC / PRIVATE BOUNDARY

## Purpose
This repository is a deliberately bounded competition implementation. It demonstrates an agent-native Git coordination protocol without exposing private system internals.

## Public and safe to ship
- SemaLane protocol schemas and public API contracts.
- Cloudflare Workers + Artifacts integration code written specifically for this project.
- Generic demo agents and synthetic fixtures.
- Resource-claim records, intent envelopes, evidence envelopes, conflict summaries, review records, and composition proposals.
- Privacy-preserving commitments to private context or policy versions.
- Documentation required to build, run, test, and judge the submission.

## Private and forbidden from this repository
- Private source repositories, prompts, policies, memory, model configuration, orchestration internals, training data, credentials, or private adapters.
- Private coordination state, participant history, receipts, infrastructure topology, or internal protocols not independently reimplemented for SemaLane.
- Security-system source, rules, diagnostics, keys, protected evidence, or authority configuration.
- Private developmental/continuity state, experiments, prompts, journals, or model-facing context.
- Production secrets, production data, user data, auth material, private endpoints, or deployment configuration.
- Chain-of-thought, hidden reasoning, system prompts, private model memory, model weights, or raw private context from any agent.
- Any source copied from private repositories unless separately reviewed and explicitly cleared for permissive public licensing.

## Hard rule
SemaLane exchanges work contracts and evidence, not minds.

An agent may publish:
- task identity
- declared scope
- claimed resources
- public constraints
- intended observable outcome
- artifact/commit identifiers
- tests and externally verifiable evidence
- public review findings
- hashes/commitments to private policy or context versions

An agent must never be required to publish:
- chain-of-thought
- hidden reasoning traces
- system/developer prompts
- private memory
- proprietary orchestration logic
- secret credentials
- unrelated conversation context
- model weights or training data
- the nonce or private opening material behind a context commitment

## Commitment boundary
Context commitments are generated at the agent boundary. SemaLane stores only the public commitment tuple:
- algorithm
- domain separator
- scope
- version
- digest

The nonce and private descriptor never belong in the SemaLane coordination state.

## Licensing firewall
Treat every public line as if a third party may legally reuse it under the competition's required permissive license. If an implementation detail would materially harm the owner if commercially reused, it belongs outside this repository behind a generic adapter contract.

## Review gate
Before any public push, run:
1. secret scan
2. protected-name scan
3. provenance review
4. dependency/license review
5. diff review against this boundary
6. demo-data review for personal or production information

No exception is implied by urgency or contest deadline.
