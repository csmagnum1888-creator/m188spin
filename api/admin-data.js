import { adminClient, json, method, requireAdmin } from "./_shared.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const supabase = adminClient();
  const [vouchers, prizes, history, admins, logs] = await Promise.all([
    supabase.from("vouchers").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("prizes").select("*").order("created_at", { ascending: true }),
    supabase.from("play_history").select("*").order("played_at", { ascending: false }).limit(500),
    admin.role === "superadmin"
      ? supabase.from("admins").select("id,name,email,role,is_active,created_at").order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase.from("admin_logs").select("id,admin_id,action,detail,created_at").order("created_at", { ascending: false }).limit(200)
  ]);

  const firstError = [vouchers, prizes, history, admins, logs].find((r) => r.error)?.error;
  if (firstError) return json(res, 500, { error: firstError.message });

  return json(res, 200, {
    admin,
    vouchers: vouchers.data,
    prizes: prizes.data,
    history: history.data,
    admins: admins.data,
    logs: logs.data
  });
}
