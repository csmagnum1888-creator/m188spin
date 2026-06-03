import { anonClient, json, method } from "./_shared.js";

export default async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;
  const { code, gameType, memberNote } = req.body || {};
  if (!code || !["spin", "claw"].includes(gameType)) {
    return json(res, 400, { error: "Kode voucher dan game wajib valid." });
  }

  const supabase = anonClient();
  const { data, error } = await supabase.rpc("redeem_voucher", {
    p_code: String(code).trim().toUpperCase(),
    p_game_type: gameType,
    p_member_note: memberNote || null
  });

  if (error) return json(res, 400, { error: error.message });
  return json(res, 200, data);
}
