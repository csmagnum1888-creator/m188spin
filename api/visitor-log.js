import { anonClient, json, method, requestMeta } from "./_shared.js";

export default async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;
  try {
    const supabase = anonClient();
    const meta = requestMeta(req);
    await supabase.from("visitor_logs").insert({
      path: req.body?.path || "/",
      ip_address: meta.ip_address,
      user_agent: meta.user_agent
    });
  } catch {
    // Visitor logging should never block the member page.
  }
  return json(res, 200, { ok: true });
}
