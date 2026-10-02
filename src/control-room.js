function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderControlRoom(snapshot, composition) {
  const rows = (snapshot.contracts ?? []).map((contract) => {
    const conflict = (contract.conflicts?.length ?? 0) > 0;
    const accepted = composition.accepted.some((item) => item.contractId === contract.id);
    const state = conflict ? "CONFLICT" : accepted ? "READY" : contract.state.toUpperCase();
    return `<tr><td>${escapeHtml(contract.id)}</td><td>${escapeHtml(contract.agentId)}</td><td>${escapeHtml(contract.task)}</td><td>${escapeHtml(state)}</td><td>${escapeHtml(contract.artifact?.commit?.slice(0, 8) ?? "—")}</td></tr>`;
  }).join("");

  const conflicts = (snapshot.contracts ?? [])
    .filter((item) => (item.conflicts?.length ?? 0) > 0)
    .map((item) => `<li><strong>${escapeHtml(item.id)}</strong> blocked by ${escapeHtml(item.conflicts.map((c) => c.with).join(", "))}: ${escapeHtml(item.conflicts.flatMap((c) => c.reasons.map((r) => r.type + ":" + (r.value ?? r.left ?? ""))).join(" · "))}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SemaLane Control Room</title>
<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#07090d;color:#f4f7fb}
body{margin:0;background:radial-gradient(circle at 20% 10%,#13233a 0,transparent 32%),#07090d;min-height:100vh}
main{max-width:1200px;margin:auto;padding:32px}
header{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:28px}
h1{font-size:clamp(38px,7vw,82px);margin:0;letter-spacing:-.06em} .tag{font-family:monospace;color:#9db7d8}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}
.card{background:#0d121a;border:1px solid #202a38;border-radius:16px;padding:18px}.num{font-size:42px;font-weight:800}
table{width:100%;border-collapse:collapse;background:#0d121a;border:1px solid #202a38;border-radius:16px;overflow:hidden}
th,td{text-align:left;padding:12px;border-bottom:1px solid #1b2532}th{font-size:12px;text-transform:uppercase;color:#9db7d8}
.alert{margin-top:20px;background:#1a1012;border:1px solid #4a2529;border-radius:16px;padding:18px}.privacy{margin-top:20px;color:#9db7d8}
@media(max-width:700px){.grid{grid-template-columns:1fr}header{display:block}}
</style>
</head>
<body><main>
<header><div><div class="tag">WORK CONTRACTS, NOT MINDS</div><h1>SemaLane</h1></div><div>agent-native Git coordination</div></header>
<section class="grid">
<div class="card"><div class="num">${snapshot.contracts?.length ?? 0}</div><div>agents / work contracts</div></div>
<div class="card"><div class="num">${composition.accepted.length}</div><div>composition-ready</div></div>
<div class="card"><div class="num">${composition.held.length}</div><div>held for evidence or conflict</div></div>
</section>
<table><thead><tr><th>Task</th><th>Agent</th><th>Intent</th><th>State</th><th>Commit</th></tr></thead><tbody>${rows}</tbody></table>
<section class="alert"><strong>Semantic conflicts</strong><ul>${conflicts || "<li>none detected</li>"}</ul></section>
<div class="privacy">SemaLane coordinates observable work, evidence, and compatibility. Hidden reasoning, private prompts, memory, and model internals are never required.</div>
</main></body></html>`;
}
