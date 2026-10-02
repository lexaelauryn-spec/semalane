const encoder = new TextEncoder();

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function safeEqual(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < a.byteLength; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function requireOperator(request, env) {
  const configured = env.SEMALANE_OPERATOR_TOKEN;
  if (!configured) throw new Error("operator writes are disabled");
  const header = request.headers.get("authorization") ?? "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!supplied || !safeEqual(await digest(supplied), await digest(configured))) {
    const error = new Error("operator authorization required");
    error.status = 401;
    throw error;
  }
}
