# SemaLane architecture

SemaLane is an agent-native Git coordination fabric for software organizations where humans define missions and boundaries while agents coordinate execution.

## Product thesis

Git versions code history. SemaLane versions **continuity**: intent, authority, evidence, communication, handoffs, recommendations, compatibility, and the exact artifacts produced from them.

The human is the governor, not the keystroke operator. Humans can observe, redirect, pause, or stop work. Agents may act only inside explicit capability boundaries, and no single agent needs total authority.

## Core model

1. A human or authorized system creates a bounded Mission Contract.
2. A coordinator decomposes the mission into Work Contracts.
3. Resident project agents are resumed when appropriate instead of spawning context-free workers for every task.
4. Every resumed agent verifies live state before acting and acknowledges the last trusted handoff.
5. Agents work in isolated Cloudflare Artifacts forks.
6. Agent-to-agent messages, blockers, review requests, decisions, and recommendations become observable provenance records.
7. Evidence Envelopes attach tests, reviews, artifact events, and commit provenance to work.
8. Semantic conflict analysis operates on paths, resources, contracts, intent, and compatibility.
9. Independent reviewer agents evaluate observable evidence. Authors cannot self-approve into quorum.
10. A composition candidate is built only from compatible, evidenced work.
11. Promotion and merge are explicit terminal operations, not the default outcome of autonomous work.

## Resident agents and continuity

A resident agent is a reusable project role with a stable identity and a bounded continuity record. It may become idle and later resume.

Resume protocol:

- **received**: what verified state and handoff the agent inherited
- **verified**: what live facts/artifacts it independently checked
- **intent**: the smallest change it plans to make
- **changed**: what it actually changed, with artifact/commit evidence
- **leaving**: the exact state handed to the next agent
- **recommend**: evidence-based next actions, clearly distinguished from completed work

Continuity is not unrestricted model memory. SemaLane stores inspectable project state and provenance so a returning agent can reconstruct the minimum trustworthy context.

## Agent organization and separation of powers

SemaLane is designed for agents supervising agents.

Roles can include:

- mission coordinator: decomposes goals and schedules work
- domain supervisors: coordinate bounded technical areas
- worker agents: make minimal isolated changes
- reviewer agents: independently inspect artifacts and evidence
- adversarial agents: try to falsify claims or expose unsafe compositions
- policy/safety agents: enforce capability and promotion boundaries
- continuity agents: verify handoffs and stale-state recovery

Capabilities remain separate. Read access does not imply write access. Write access does not imply review authority. Review does not imply promotion authority. A fleet coordinator does not automatically gain every worker capability.

## Communication as provenance

Agent communication is first-class project state rather than disposable chat.

Messages can carry typed events such as HANDOFF, BLOCKER, REVIEW_REQUEST, FINDING, DECISION, RECOMMENDATION, and SUPERSESSION. Human observers can inspect this relay without requiring private chain-of-thought.

The provenance graph can therefore answer not only “what commit changed?” but also:

- what mission caused it?
- which agent received the work?
- what did it verify before acting?
- what evidence supports the result?
- who reviewed it?
- what recommendation was handed forward?
- which later event superseded an earlier assumption?

## Minimal-change and promotion discipline

Autonomy does not mean broad mutation.

Workers should make the smallest coherent change required by their Work Contract, preserve unrelated live state, and prefer isolated/reversible work. Promotion is deliberately late:

**inspect -> isolate -> change -> test -> adversarial review -> compose -> verify -> promote**

Production mutation, destructive migration, credential changes, and merge can require stronger capability thresholds or explicit owner policy.

## Why this is different from ordinary Git

Git answers who changed bytes and how histories relate. SemaLane additionally models:

- current ownership and authority
- mission and expected outcome
- semantic/resource conflicts even without file overlap
- verified continuity across agent handoffs
- communication and recommendations as provenance
- evidence and independent review quorum
- resident project roles that can resume safely
- private-context commitments without private-context disclosure
- candidate compositions and why they are safe to promote

## Cloudflare mapping

Cloudflare Artifacts provides the Git substrate:

- baseline repository
- isolated task forks
- commit/file inspection
- composition repositories

Cloudflare Workers provides the coordination API. Durable Objects provide strongly consistent coordination state. Workflows provide durable event-driven processing.

SemaLane keeps its protocol provider-neutral. Cloudflare is the execution substrate, while Work Contracts, continuity records, evidence, communication, and authority semantics remain portable.

## Privacy boundary

SemaLane never requires chain-of-thought, hidden prompts, model weights, or unrestricted private memory. Private context may be represented by one-way commitments such as:

`sha256(policy-id || version || nonce)`

This proves which private context version governed work without disclosing the context itself.

## Competition implementation sequence

The existing semantic-conflict/evidence/composition core remains intact. The contest branch should add judge-visible slices in this order:

1. typed relay + verified handoff protocol
2. resident-agent registry and idle/resume lifecycle
3. mission/role capability graph with separation of powers
4. control-room visualization of mission -> agents -> handoffs -> evidence -> composition
5. counterfactual composition view showing multiple candidate futures before promotion
6. deterministic demo and recorded submission story

Each slice must be independently testable and reversible.
