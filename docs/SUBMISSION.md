# SemaLane competition submission packet

## One-line pitch
SemaLane is agent-native Git coordination that lets many AI coding agents work in parallel through shared intent, evidence, and semantic contracts without exposing private reasoning.

## Demo thesis
Ordinary Git detects textual history and merge conflicts. SemaLane also detects incompatible intent, ownership, and API-contract collisions before composition.

## 5–10 minute demo storyboard

### 0:00–0:45 — The problem
Show twelve agents working concurrently on one baseline. Explain that existing Git platforms can isolate branches and commits, but do not natively know what each agent intends to change or what private context governed its work.

### 0:45–1:45 — Work Contracts
Open the SemaLane control room. Show task, owner, scope, paths, semantic contracts, and privacy commitments. State clearly that chain-of-thought, prompts, memory, and model internals never enter SemaLane.

### 1:45–3:00 — Cloudflare-native execution
Show the Artifacts namespace and per-task repositories. Each task receives an isolated repository/fork. Push events flow into the Worker and strongly consistent Durable Object state.

### 3:00–4:15 — The semantic conflict
TASK-3 changes implementation under src/auth. TASK-12 changes documentation under docs/client. There is no textual overlap. Both claim public-api:auth-v2. SemaLane blocks TASK-12 before composition.

### 4:15–5:30 — Evidence instead of confidence
Show passing-test evidence and two independent reviewer approvals. The author cannot self-approve into quorum. Show the evidence graph.

### 5:30–6:45 — Composition
Show the deterministic composition plan. The plan names exact source repositories and commits. Materialize the composition manifest repository in Artifacts through Git, not a proprietary write API.

### 6:45–7:45 — Privacy proof
Open a context commitment. Demonstrate that changing the private opening fails verification while the private descriptor and nonce never appear in SemaLane state.

### 7:45–8:45 — Recovery and portability
Explain that SemaLane semantics are provider-neutral. Cloudflare supplies excellent distributed Git storage, eventing, Workflows, and CI runners, while Work Contracts/evidence remain portable.

### 8:45–9:30 — Why it matters
Agents should collaborate by exposing what they are changing and evidence that it works, not by exposing how they think.

## Submission checklist
- [x] Working Cloudflare deployment
- [x] Artifacts beta/account access verified
- [ ] Public source repository created
- [x] Apache-2.0 license visible
- [x] README run instructions verified from a clean environment
- [x] npm test passes
- [x] npm run preflight passes with operator protected terms configured
- [x] Demo seed creates the 12-agent scenario
- [x] Live push event observed
- [x] Live composition repository materialized
- [x] Control-room browser flow visually verified
- [x] No private prompts, memories, credentials, production data, or protected internal names present
- [ ] 5–10 minute demo recorded
- [ ] Contest application fields completed before deadline
