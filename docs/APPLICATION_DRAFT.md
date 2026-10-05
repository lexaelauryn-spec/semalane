# SemaLane submission draft

> **DRAFT ONLY. DO NOT SUBMIT WITHOUT OWNER REVIEW.**

## Project name
SemaLane

## One-line description
**Git versions code. SemaLane versions continuity.**

## Short description
SemaLane is an agent-native coordination fabric for software teams of AI agents. Humans set a mission and boundaries; resident agents verify project state, work in isolated Git repositories, exchange inspectable handoffs, review one another, detect semantic conflicts, and expose evidence-backed candidate futures before anything crosses a promotion boundary.

## The problem
Git can tell us which bytes changed and whether textual histories collide. Multi-agent software development introduces another layer: intent, authority, continuity, evidence, review, and semantic compatibility. Two agents can make perfectly mergeable file edits while implementing mutually incompatible assumptions. Disposable agent sessions can also lose why work happened, what was verified, and what the next agent should trust.

## What SemaLane does
SemaLane adds an agent-native coordination layer around Git:

- **Mission Contracts** preserve the human objective, boundaries, and success criteria.
- **Work Contracts** make agent intent and semantic claims explicit.
- **Resident agents** resume from versioned observable state rather than hidden permanent memory.
- **Verified Relay** turns agent-to-agent handoffs into inspectable project provenance.
- **Separation of powers** bounds read, write, review, and promotion authority independently.
- **Semantic conflict detection** catches incompatible intent even when files do not overlap.
- **Evidence and independent review** determine whether completed work is composition-ready.
- **Candidate Futures** show a safe composition plus counterfactual alternatives and the exact requirements that would unlock them.
- **The Control Room** lets a human observe the organization without turning observation into mutation.

## Why Cloudflare
Cloudflare is the execution substrate for the prototype:

- Workers expose the control plane and read-only judge experience.
- Durable Objects hold authoritative coordination state.
- Workflows react to repository push events and validate composition provenance.
- Artifacts provides isolated Git repositories for task work and deterministic composition.

The SemaLane protocol itself is provider-neutral: Cloudflare executes the system without owning its semantics.

## Privacy
SemaLane exchanges work and evidence, not minds. It does not require chain-of-thought, system prompts, private memory, model internals, or proprietary orchestration. Private context can be represented by a one-way commitment while observable work remains auditable.

## What makes it different
Most agent coding demos focus on generating more code. SemaLane focuses on what happens when many agents must remain compatible over time. Its core object is not a chat or a patch. It is organizational continuity: who was authorized to do what, what they verified, what evidence exists, what conflicts remain, and which future is safe to promote.

## Demo narrative
One human mission wakes a bounded resident team. An auth worker completes isolated work and receives independent reviews. A second task edits different files but claims the same semantic API contract, so SemaLane blocks it despite the absence of a textual conflict. The Control Room shows the verified handoff history, the safe-now composition, and a counterfactual future explaining exactly what must change before the blocked task could join it.

## Public repository
https://github.com/lexaelauryn-spec/semalane

## Run locally
```bash
npm ci
npm run check
npm test
npm run demo:organization
npm run preflight
```

## Before submission
Insert only after final owner review:
- final verified live Control Room URL
- final demo video URL
- any contest-form-specific word-limit edits
- final screenshots if requested

Do not submit from this document automatically.


## Exact current Cloudflare form fields

Verified against Cloudflare's public submission form on October 5, 2026.

### Your team
- Team name *
- Primary contact name *
- Primary contact email *
- Team location *
- First attendee name *
- First attendee email *
- Second attendee name (optional)
- Second attendee email (optional)

### Your project
- Project name * — **SemaLane**
- Project vision * — use/adapt the “problem”, “what SemaLane does”, and “what makes it different” sections above.
- How you used Cloudflare * — use/adapt the “Why Cloudflare” section above.

### Demo and source
- Demo video * — upload MP4, WebM, or MOV; maximum 2 GiB.
- Open source repository URL * — https://github.com/lexaelauryn-spec/semalane
- Instructions to run your project * — use the commands above.
- Confirm project was built using Cloudflare Workers and Artifacts.
- Confirm submission follows the competition terms.

Cloudflare's competition page currently asks for a 5–10 minute demo. The prepared script targets 7–8 minutes.

Do not fill personal contact/attendee fields or perform the final upload/submit action until owner review.
