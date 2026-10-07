# SemaLane competition demo script

Target length: **7–8 minutes**

> Pre-submission draft. Use the final verified live URL after the contest branch is deliberately deployed. Do not expose operator tokens, Cloudflare credentials, private repositories, private prompts, or XAEL.L internal tooling.

## 0:00–0:40 — What Git is missing
**On screen:** SemaLane Control Room hero and Mission panel.

**Narration:**
> Git gives us a history of code. But an organization of AI agents also needs a history of intent, authority, evidence, communication, and continuity. SemaLane adds that missing layer.

## 0:40–1:20 — One human mission
**On screen:** Mission.

> The human sets the objective, boundaries, and success criteria once. They govern the mission instead of approving every keystroke. In this demo the mission is to upgrade authentication without breaking existing clients, with explicit no-deploy and compatibility boundaries.

## 1:20–2:10 — Resident organization
**On screen:** Resident Team.

> These are stable project roles, not disposable blank chats. They can go idle and resume by reconstructing continuity from observable project state. Read, write, review, and promotion authority are separate capabilities.

## 2:10–3:00 — Verified Relay
**On screen:** Verified Relay.

> Agents do not pass hidden thoughts. They pass an inspectable handoff: what they received, what they verified, what changed, what they leave behind, and what they recommend next. That handoff becomes project provenance.

## 3:00–3:50 — The conflict Git cannot see
**On screen:** TASK-AUTH, TASK-DOCS, Semantic Conflicts.

> These tasks touch different paths, so a textual merge can look harmless. But both claim the same semantic API contract. SemaLane sees the intent collision and blocks the incompatible work before composition.

## 3:50–4:40 — Evidence and separation of powers
**On screen:** Contracts/evidence state.

> Completion is not confidence. Work needs observable evidence and independent review. The author cannot review itself into the safe composition, and a worker does not gain promotion authority merely because its task passed.

## 4:40–5:40 — Candidate Futures
**On screen:** Candidate Futures.

> Instead of only saying merge or don't merge, SemaLane shows multiple futures. One is safe now. A counterfactual can include blocked work while explaining exactly what must become true before that future could be promoted. Looking at a future changes nothing.

## 5:40–6:30 — Cloudflare-native execution
**On screen:** architecture/config and, if useful, synthetic Artifacts repositories.

> Cloudflare Workers provide the control plane, Durable Objects preserve coordination state, Workflows react to Artifacts events, and Artifacts provide isolated Git repositories. Cloudflare executes SemaLane, but the coordination protocol stays provider-neutral.

## 6:30–7:10 — Privacy and recovery
**On screen:** public/private boundary and a clean test run.

> SemaLane versions continuity without collecting agent minds. No chain-of-thought, private prompts, or private memory are required. Private context can be represented by a one-way commitment while observable work remains auditable.

Run:
```bash
npm ci
npm run check
npm test
npm run demo:organization
npm run preflight
```

Do not narrate a fixed test count. Show the current green result.

## 7:10–7:40 — Close
**On screen:** Control Room.

> SemaLane is what happens when we stop treating AI agents like autocomplete and start treating them like an organization. Git gave humans a history of code. SemaLane gives agent organizations a history of continuity.

## Recording rules
- Synthetic demo data only.
- Never expose secrets or private context.
- Keep the Control Room readable at 1080p and test a narrow/mobile viewport before recording.
- Never imply a counterfactual future has executed.
- Never imply autonomous promotion. Promotion remains an explicit authority boundary.
- Use only facts visible in the final deployed build or its final green CI receipts.
