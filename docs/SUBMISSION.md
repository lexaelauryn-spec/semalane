# SemaLane competition submission packet

## One-line pitch
**Git versions code. SemaLane versions continuity.**

SemaLane is an agent-native coordination system where humans set missions and boundaries while persistent agent teams verify state, communicate, hand work forward, review one another, and compose proven changes without exposing private reasoning.

## Demo thesis
Do not demo “GitHub with agents.” Demo an **agent organization**.

One human supplies a mission. A coordinator activates a bounded resident team. Agents verify the live state before acting, work in isolated repositories, communicate through typed provenance, hand off with evidence, recommend what should happen next, detect semantic collisions ordinary Git cannot see, and produce candidate compositions. The human observes and retains stop/redirect/promotion authority.

## The judge-visible primitives

### 1. Verified Relay
Every agent begins by acknowledging what it received and verifying live state. Every handoff ends with:
- Received
- Verified
- Changed
- Leaving
- Recommend

The next agent must reconcile that handoff against reality before continuing.

### 2. Resident Agents
Project agents can go idle and later resume under the same bounded role. They do not rely on magical permanent memory; they reconstruct continuity from versioned project state and provenance.

### 3. Separation of Powers
No omnipotent swarm agent. Read, write, review, adversarial-test, coordinate, and promote capabilities can belong to different agents. Agents supervise agents.

### 4. Communication-Aware Version Control
HANDOFF, BLOCKER, REVIEW_REQUEST, FINDING, DECISION, RECOMMENDATION, and SUPERSESSION are project events connected to commits, contracts, evidence, and agents.

### 5. Semantic Conflict Detection
TASK-3 changes `src/auth`; TASK-12 changes `docs/client`. No textual collision exists, but both claim `public-api:auth-v2`. SemaLane catches the incompatible intent.

### 6. Counterfactual Composition
Before promotion, show more than “merge / don't merge.” Show candidate futures: which compatible set can be composed, what is held, why, and what evidence would unlock another future.

## 5–10 minute demo storyboard

### 0:00–0:45 — One mission
Enter a plain-language mission. Explain: the human governs the objective and boundaries, not every keystroke.

### 0:45–1:45 — The resident team wakes
Show reusable project agents transitioning idle -> verifying -> active. Each displays role, capability boundary, last handoff, and verified live state.

### 1:45–2:45 — The relay
Show an agent handoff in plain language: Received / Verified / Changed / Leaving / Recommend. The next agent verifies the inherited facts before acting.

### 2:45–3:45 — Agents supervising agents
Show coordinator, workers, independent reviewers, adversarial reviewer, and promotion boundary. Demonstrate that no one role possesses every capability.

### 3:45–4:45 — What Git misses
TASK-3 and TASK-12 touch different files but claim the same semantic contract. Ordinary textual merge logic sees no collision. SemaLane holds the incompatible work.

### 4:45–5:45 — Evidence, not confidence
Show tests, artifact provenance, and independent review quorum. The author cannot self-approve.

### 5:45–6:45 — Communication becomes provenance
Open the project relay. Trace mission -> handoff -> finding -> review -> recommendation -> artifact. No chain-of-thought is exposed.

### 6:45–7:45 — Multiple futures
Show two candidate compositions and explain why one is safe now while another requires evidence or conflict resolution.

### 7:45–8:30 — Cloudflare-native substrate
Show Artifacts forks, Durable Object state, Workflow eventing, and the Worker control plane.

### 8:30–9:15 — Privacy and recovery
Show that private context is represented only by a commitment. Resume a resident agent and prove it reconstructs the project from observable state.

### 9:15–9:45 — Close
“Git gave humans a history of code. SemaLane gives agent organizations a history of continuity.”

## Build order

### P0: preserve the proven core
Keep the current Work Contracts, semantic conflict engine, evidence graph, independent review quorum, privacy commitments, deterministic composition, operator auth, and Cloudflare integration passing.

### P1: continuity relay
Implement typed relay records and verified handoff envelopes. Add regression coverage for stale handoffs, supersession, unknown contracts, and private-field rejection.

### P2: resident agent lifecycle
Add stable agent identity, bounded role/capabilities, idle/resume state, last verified handoff, and “changes since last active” reconstruction.

### P3: recursive governance
Represent coordinator/supervisor/worker/reviewer/adversarial roles and capability separation. Prove a worker cannot promote its own work and a coordinator cannot silently bypass review.

### P4: counterfactual compositions
Expose at least two deterministic candidate futures and the evidence/conflict reason each is or is not promotable.

### P5: control room
Make the first screen explain the product in 30 seconds: Mission, Resident Team, Relay, Evidence, Semantic Conflicts, Candidate Futures, Promotion Boundary.

### P6: demo hardening
Create a deterministic reset/seed path, run the scenario repeatedly, test failure cases, verify mobile/desktop readability, and keep synthetic data only.

### P7: submission
Update all old CloudForge naming, record the 5–10 minute video, complete application fields, perform a clean-environment run, and submit with buffer before the deadline.

## Non-negotiable safety model

Autonomy is bounded, not unrestricted:
- verify live state before mutation
- smallest coherent change
- isolated work before shared mutation
- evidence before promotion
- independent review before composition
- explicit capability boundaries
- merge/deploy/destructive operations remain terminal gated actions
- no chain-of-thought or private prompt collection

## Current checklist
- [x] Working Cloudflare deployment
- [x] Artifacts access verified
- [x] Public source repository
- [x] Apache-2.0
- [x] Existing tests/preflight
- [x] 12-agent semantic-conflict demo
- [x] Live composition materialization
- [x] Existing control room
- [ ] Verified Relay
- [ ] Resident Agent lifecycle
- [ ] Capability/separation-of-powers graph
- [ ] Counterfactual composition view
- [ ] Judge-facing control-room redesign
- [ ] SemaLane naming cleanup in live URL/docs
- [ ] 5–10 minute demo recorded
- [ ] Contest application completed
