function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function list(items, empty = "none") {
  if (!items?.length) return `<span class="muted">${escapeHtml(empty)}</span>`;
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function pill(value, tone = "") {
  return `<span class="pill ${tone}">${escapeHtml(value)}</span>`;
}

export function renderControlRoom(snapshot, composition, futures = { futures: [] }) {
  const agents = snapshot.agents ?? [];
  const relay = snapshot.relay ?? [];
  const contracts = snapshot.contracts ?? [];
  const missions = snapshot.missions ?? [];
  const activeAgents = agents.filter((item) => item.state === "active").length;
  const heldCount = composition.held?.length ?? 0;

  const contractRows = contracts.map((contract) => {
    const conflict = (contract.conflicts?.length ?? 0) > 0;
    const accepted = (composition.accepted ?? []).some((item) => item.contractId === contract.id);
    const state = conflict ? "CONFLICT" : accepted ? "READY" : String(contract.state ?? "unknown").toUpperCase();
    return `<tr>
      <td><strong>${escapeHtml(contract.id)}</strong></td>
      <td>${escapeHtml(contract.agentId)}</td>
      <td>${escapeHtml(contract.task)}</td>
      <td>${pill(state, conflict ? "bad" : accepted ? "good" : "")}</td>
      <td><code>${escapeHtml(contract.artifact?.commit?.slice(0, 8) ?? "—")}</code></td>
    </tr>`;
  }).join("");

  const agentCards = agents.map((agent) => `<article class="agent">
    <div class="row"><strong>${escapeHtml(agent.id)}</strong>${pill(agent.state ?? "unknown", agent.state === "active" ? "good" : "")}</div>
    <div class="muted">${escapeHtml(agent.role)}</div>
    <div class="caps">${(agent.capabilities ?? []).map((cap) => pill(cap)).join(" ") || pill("no capabilities")}</div>
    <div class="tiny">last handoff: <code>${escapeHtml(agent.lastHandoffId ?? "none")}</code></div>
  </article>`).join("");

  const relayRows = relay.slice(-8).reverse().map((item) => `<article class="relay-item">
    <div class="row"><strong>${escapeHtml(item.kind)}</strong><code>${escapeHtml(item.id)}</code></div>
    <div>${escapeHtml(item.agentId)} → ${escapeHtml(item.recipientAgentId ?? "project")}</div>
    <p>${escapeHtml(item.summary)}</p>
    ${item.kind === "HANDOFF" ? `<div class="relay-grid">
      <div><span class="eyebrow">verified</span>${list(item.verified)}</div>
      <div><span class="eyebrow">leaving</span>${list(item.leaving)}</div>
      <div><span class="eyebrow">recommend</span>${list(item.recommend)}</div>
    </div>` : ""}
  </article>`).join("");

  const conflictItems = contracts
    .filter((item) => (item.conflicts?.length ?? 0) > 0)
    .map((item) => `<li><strong>${escapeHtml(item.id)}</strong> blocked by ${escapeHtml(item.conflicts.map((c) => c.with).join(", "))}: ${escapeHtml(item.conflicts.flatMap((c) => c.reasons.map((r) => r.type + ":" + (r.value ?? r.left ?? ""))).join(" · "))}</li>`)
    .join("");

  const futureCards = (futures.futures ?? []).map((future) => `<article class="future">
    <div class="row"><strong>${escapeHtml(future.id)}</strong>${pill(future.promotable ? "SAFE NOW" : "COUNTERFACTUAL", future.promotable ? "good" : "warn")}</div>
    <div class="tiny">includes</div>
    <div class="caps">${(future.accepted ?? []).map((id) => pill(id)).join(" ") || pill("none")}</div>
    <div class="tiny">held: ${escapeHtml((future.held ?? []).join(", ") || "none")}</div>
    ${future.requirements?.length ? `<div class="requirements"><span class="eyebrow">unlock requirements</span>${list(future.requirements)}</div>` : ""}
  </article>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SemaLane Control Room</title>
<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#07090d;color:#f4f7fb}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 18% 8%,#152741 0,transparent 30%),#07090d;min-height:100vh}
main{max-width:1240px;margin:auto;padding:28px}header{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end;margin-bottom:24px}
h1{font-size:clamp(42px,8vw,88px);margin:0;letter-spacing:-.065em;line-height:.9}h2{margin:0 0 12px;font-size:22px}p{line-height:1.5}
.tag,.eyebrow{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#9db7d8;text-transform:uppercase;letter-spacing:.08em;font-size:12px}
.hero-copy{max-width:650px;color:#bcc8d8}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:22px 0}
.card,.panel,.agent,.relay-item,.future{background:#0d121a;border:1px solid #202a38;border-radius:16px}.card{padding:18px}.num{font-size:38px;font-weight:850}
.panel{padding:18px;margin-top:16px}.panel-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.muted,.tiny{color:#9db0c7}.tiny{font-size:12px;margin-top:8px}
.team,.future-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.agent,.future{padding:14px}.row{display:flex;justify-content:space-between;align-items:center;gap:10px}
.pill{display:inline-block;border:1px solid #334154;border-radius:999px;padding:3px 8px;font:11px ui-monospace,SFMono-Regular,Menlo,monospace;color:#b8c8dc;margin:2px}
.pill.good{border-color:#225b48;color:#7fe3bb}.pill.warn{border-color:#665b24;color:#e8d36d}.pill.bad{border-color:#6b2d35;color:#ff9da9}
.caps{margin-top:10px}.relay{display:grid;gap:10px}.relay-item{padding:14px}.relay-item p{margin:8px 0}
.relay-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.relay-grid ul,.requirements ul{margin:6px 0 0;padding-left:18px;color:#c7d2df}
table{width:100%;border-collapse:collapse;background:#0a0f16;border:1px solid #202a38;border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:11px;border-bottom:1px solid #1b2532}th{font-size:11px;text-transform:uppercase;color:#9db7d8}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.alert{background:#1a1012;border-color:#4a2529}.boundary{background:linear-gradient(135deg,#101827,#0d121a);border-color:#2b4568}
.boundary strong{font-size:18px}.boundary .line{margin-top:10px;padding:12px;border:1px dashed #45678f;border-radius:12px}
footer{margin:22px 0;color:#879bb3;font-size:13px}
@media(max-width:760px){header{grid-template-columns:1fr}.metrics{grid-template-columns:1fr 1fr}.relay-grid{grid-template-columns:1fr}main{padding:18px}table{font-size:12px}th,td{padding:8px}}
</style>
</head>
<body><main>
<header>
  <div><div class="tag">Git versions code. SemaLane versions continuity.</div><h1>SemaLane</h1></div>
  <div class="hero-copy">Humans set the mission and boundaries. Resident agents verify reality, relay work, review independently, and expose evidence before anything crosses the promotion boundary.</div>
</header>

<section class="panel boundary">
  <div class="eyebrow">human intent</div><h2>Mission</h2>
  ${missions.length ? missions.map((mission) => `<article><strong>${escapeHtml(mission.objective)}</strong><div class="tiny">boundaries</div>${list(mission.boundaries, "none")}<div class="tiny">success criteria</div>${list(mission.successCriteria, "none")}</article>`).join("") : '<span class="muted">No mission registered yet.</span>'}
</section>

<section class="metrics">
  <div class="card"><div class="num">${contracts.length}</div><div>work contracts</div></div>
  <div class="card"><div class="num">${agents.length}</div><div>resident agents</div></div>
  <div class="card"><div class="num">${activeAgents}</div><div>active now</div></div>
  <div class="card"><div class="num">${heldCount}</div><div>held from composition</div></div>
</section>

<section class="panel">
  <div class="panel-head"><div><div class="eyebrow">organization</div><h2>Resident team</h2></div><span class="muted">observe roles and bounded authority</span></div>
  <div class="team">${agentCards || '<span class="muted">No resident agents registered yet.</span>'}</div>
</section>

<section class="panel">
  <div class="panel-head"><div><div class="eyebrow">continuity</div><h2>Verified relay</h2></div><span class="muted">handoffs become project provenance</span></div>
  <div class="relay">${relayRows || '<span class="muted">No relay records yet.</span>'}</div>
</section>

<section class="panel">
  <div class="panel-head"><div><div class="eyebrow">work</div><h2>Contracts and evidence state</h2></div></div>
  <table><thead><tr><th>Task</th><th>Agent</th><th>Intent</th><th>State</th><th>Commit</th></tr></thead><tbody>${contractRows}</tbody></table>
</section>

<section class="panel alert">
  <div class="eyebrow">compatibility</div><h2>Semantic conflicts</h2>
  <ul>${conflictItems || "<li>none detected</li>"}</ul>
</section>

<section class="panel">
  <div class="panel-head"><div><div class="eyebrow">counterfactual planning</div><h2>Candidate futures</h2></div><span class="muted">descriptive only; viewing a future changes nothing</span></div>
  <div class="future-grid">${futureCards || '<span class="muted">No candidate futures available yet.</span>'}</div>
</section>

<section class="panel boundary">
  <div class="eyebrow">human governance</div><h2>Promotion boundary</h2>
  <strong>Agents may recommend a future. Promotion requires explicit authority.</strong>
  <div class="line">This control room is read-only. Humans can observe state and evidence without turning observation into mutation. Composition, merge, deploy, or other consequential promotion remains a separate authorized operation.</div>
</section>

<footer>SemaLane records observable work, evidence, authority, communication, and compatibility. Hidden reasoning, private prompts, private memory, and model internals are not required.</footer>
</main></body></html>`;
}
