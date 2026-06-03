import { json, method, requireAdmin } from "./_shared.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  return json(res, 200, { admin });
}
