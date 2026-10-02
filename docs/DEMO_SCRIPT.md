# SemaLane competition demo script

Target length: **8–9 minutes**

Live control room:
https://cloudforge-agent-fabric.alexandrechoken.workers.dev/control-room

Public source:
https://github.com/lexaelauryn-spec/semalane

## Recording setup

Open these tabs before recording:

1. GitHub repository README
2. Live SemaLane control room
3. Live `/composition` endpoint
4. Live `/state` endpoint
5. Cloudflare Artifacts namespace `agent-fabric`
6. `docs/PUBLIC_PRIVATE_BOUNDARY.md` in GitHub
7. A terminal in a fresh SemaLane checkout

Do not display operator tokens, Cloudflare credentials, private repositories, private prompts, or internal XAEL.L tooling.

---

## 0:00–0:45 — What Git is missing

**On screen:** GitHub README, title and first paragraph.

**Narration:**

> This is SemaLane. Git is extremely good at tracking what bytes changed and how commits relate. But when many coding agents work in parallel, that is only half the problem. We also need to know what each agent intends to change, which semantic contracts it touches, what evidence supports its work, and whether two changes conflict even when they never edit the same file.
>
> SemaLane adds that coordination layer without asking agents to reveal how they think.

Pause on the line: **Agent collaboration for Git without sharing agent minds.**

---

## 0:45–1:40 — Work Contracts, not minds

**On screen:** Live control room.

Point to:
- `WORK CONTRACTS, NOT MINDS`
- 12 agents / work contracts
- 11 composition-ready

**Narration:**

> This is a real Cloudflare deployment. Twelve synthetic coding agents registered twelve Work Contracts. A Work Contract contains bounded, useful coordination data: the task, owner, paths, resources, semantic contracts, constraints, expected outcome, and a one-way commitment to the private context version that governed the work.
>
> It does not contain chain-of-thought, system prompts, private memory, model weights, or proprietary orchestration.
>
> Eleven agents completed compatible work and are composition-ready.

---

## 1:40–2:45 — The conflict Git cannot see

**On screen:** Scroll to TASK-3 and TASK-12, then the **Semantic conflicts** box.

**Narration:**

> Here is the core demo. TASK-3 changes the auth implementation under `src/auth`. TASK-12 changes client documentation under `docs/client`.
>
> There is no file overlap. A normal textual merge system has no reason to call this a conflict.
>
> But both Work Contracts claim the semantic contract `public-api:auth-v2`. SemaLane detects that shared contract and blocks TASK-12 against TASK-3 before composition.
>
> The important point is that SemaLane does this from declared public intent and observable contracts. It does not need either agent's hidden reasoning.

Pause on the conflict row long enough to read it.

---

## 2:45–3:45 — Real Git artifacts on Cloudflare

**On screen:** Cloudflare Artifacts namespace `agent-fabric`.

Show several `task-task-*` repositories and the composition repository.

**Narration:**

> These are not simulated branches in memory. Each completed task produced a real Git-compatible repository in Cloudflare Artifacts.
>
> Eleven task repositories emitted real push events. Those events flowed into a Cloudflare Workflow and then into a strongly consistent Durable Object coordination state.
>
> The live state currently contains twelve real Artifacts push events in total: eleven task pushes and one composition push.

If practical, briefly show one task repository commit.

---

## 3:45–4:45 — Evidence instead of agent confidence

**On screen:** Open the live `/state` endpoint. Search for `"evidence"`, then show representative test/review entries.

**Narration:**

> SemaLane does not accept work because an agent says it is confident.
>
> Each completed task has one passing-test evidence record and two independent reviewer approvals. That is thirty-three evidence records across the eleven completed tasks.
>
> The author cannot self-approve its own work into quorum. Evidence and review remain independently inspectable.
>
> Across the current demo, the evidence graph contains fifty-seven nodes and forty-four edges connecting Work Contracts, commits, tests, reviews, and Artifacts events.

Do not linger on raw JSON longer than necessary.

---

## 4:45–5:50 — Deterministic composition

**On screen:** Live `/composition` endpoint, then the Artifacts composition repository.

**Narration:**

> Once work has a real observed commit, passing tests, independent review quorum, and no unresolved conflict, it becomes eligible for deterministic composition.
>
> This composition plan names eleven exact source repositories and exact commit IDs. SemaLane materializes a composition manifest through Git itself.
>
> Cloudflare Workflow then validates the provenance. In this run, validation completed successfully: eleven source commits checked, zero missing.
>
> That gives us an inspectable answer to a question agent swarms usually struggle with: exactly which work was composed, from exactly which commits, and why was each piece eligible?

---

## 5:50–6:45 — Privacy proof

**On screen:** GitHub `docs/PUBLIC_PRIVATE_BOUNDARY.md`, then terminal.

Run:

```bash
npm test
```

Optionally highlight the tests:
- `privacy boundary rejects chain-of-thought payloads`
- `context commitments verify without exposing the private descriptor`
- `changed private context fails the commitment opening`
- `work contracts reject commitment opening material`

**Narration:**

> Privacy is an architectural boundary, not a promise in the README.
>
> The protocol explicitly rejects private reasoning fields. Private context can be represented by a one-way SHA-256 commitment, but the private descriptor and nonce never enter coordination state.
>
> The public repository has thirty-one passing tests, including direct tests for reasoning rejection, context-commitment verification, secret scanning, authorization, semantic conflicts, composition provenance, and the real Cloudflare event shape we encountered during deployment.

Let the test summary show **31 pass, 0 fail**.

---

## 6:45–7:35 — A live Cloudflare bug became a regression test

**On screen:** `docs/LIVE_INTEGRATION.md`, section “Real integration bug found during the run.”

**Narration:**

> Building this against the real platform exposed an integration edge case.
>
> Direct Artifacts events include an event timestamp inside their metadata. The Workflow-delivered form can expose that timestamp separately and omit the metadata wrapper.
>
> Our first live event normalizer rejected that real Workflow payload. We fixed it by deterministically hydrating only the missing timestamp from the Workflow event, without reconstructing private author context, and added a regression test for that exact failure.
>
> The repaired workflow then completed the task events and validated the final composition successfully.

This section demonstrates that the project is genuinely integrated, not a mocked prototype.

---

## 7:35–8:20 — Portability and the close

**On screen:** Back to the control room, then GitHub Architecture doc.

**Narration:**

> Cloudflare gives SemaLane a strong execution substrate: Git-compatible Artifacts, Workers, Durable Objects, eventing, and Workflows.
>
> But the coordination semantics are provider-neutral. Work Contracts, evidence, semantic claims, conflict facts, and composition provenance do not require agents to share a model vendor, a private memory system, or hidden reasoning.
>
> The idea is simple: agents should collaborate by exposing what they are changing and evidence that it works, not by exposing how they think.
>
> That is SemaLane: agent collaboration for Git without sharing agent minds.

End on the live control room with TASK-12 visibly marked **CONFLICT**.

---

## Optional 20-second technical appendix

Use only if the main recording is under time.

**On screen:** terminal.

```bash
npm ci
npm test
npm run demo
npm run preflight
npx wrangler deploy --dry-run
```

**Narration:**

> The repository is Apache-2.0, installs from a clean checkout, has zero npm audit vulnerabilities in the verified build, passes all thirty-one tests and the privacy preflight, and produces a valid Wrangler deployment bundle.

---

## Facts to keep exact

- 12 Work Contracts
- 11 completed / composition-ready
- 1 blocked semantic conflict: TASK-12 versus TASK-3
- semantic contract: `public-api:auth-v2`
- 33 evidence records
- 12 Artifacts push events
- 57 evidence-graph nodes
- 44 evidence-graph edges
- 11 exact source commits in the composition
- 0 missing source commits
- 31 passing tests
- Apache-2.0
- Cloudflare Workers + Durable Objects + Workflows + Artifacts
