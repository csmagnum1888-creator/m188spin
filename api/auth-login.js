import { addLog, adminClient, clearSessionCookie, json, method, optionalAdmin, setSessionCookie, signAdmin, verifyPassword } from "./_shared.js";

export default async function handler(req, res) {
  if (!method(req, res, ["POST", "DELETE"])) return;

  if (req.method === "DELETE") {
    const admin = await optionalAdmin(req);
    if (admin) {
      await addLog(adminClient(), admin.id, "logout_admin", { email: admin.email }, req);
    }
    clearSessionCookie(res);
    return json(res, 200, { ok: true });
  }

  const { email, password } = req.body || {};
  if (!email || !password) return json(res, 400, { error: "Email dan password wajib diisi." });

  const supabase = adminClient();
  const { data: admin, error } = await supabase
    .from("admins")
    .select("id,name,email,password_hash,role,is_active,created_at")
    .eq("email", String(email).toLowerCase().trim())
    .single();

  if (error || !admin || !admin.is_active) return json(res, 401, { error: "Login gagal." });
  const ok = await verifyPassword(password, admin.password_hash);
  if (!ok) return json(res, 401, { error: "Login gagal." });

  const token = signAdmin(admin);
  setSessionCookie(res, token);
  await addLog(supabase, admin.id, "login_admin", { email: admin.email }, req);

  const { password_hash, ...safeAdmin } = admin;
  return json(res, 200, { admin: safeAdmin });
}
