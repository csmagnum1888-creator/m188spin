import { addLog, adminClient, clearSessionCookie, json, method, optionalAdmin, setSessionCookie, signAdmin } from "./_shared.js";

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
  const normalizedEmail = String(email).trim().toLowerCase();
  const { data, error } = await supabase.rpc("verify_admin_login", {
    p_email: normalizedEmail,
    p_password: String(password)
  });

  const admin = Array.isArray(data) ? data[0] : null;
  if (error || !admin) {
    const { data: existing } = await supabase
      .from("admins")
      .select("id,email,is_active")
      .ilike("email", normalizedEmail)
      .maybeSingle();
    const reason = !existing ? "email_not_found" : existing.is_active ? "wrong_password" : "inactive_admin";
    await addLog(supabase, existing?.id || null, "login_admin_failed", { email: normalizedEmail, reason }, req);
    const message = reason === "inactive_admin"
      ? "Akun admin tidak aktif."
      : reason === "email_not_found"
        ? "Email admin tidak ditemukan."
        : "Password admin salah.";
    return json(res, 401, { error: message });
  }

  const token = signAdmin(admin);
  setSessionCookie(res, token);
  await addLog(supabase, admin.id, "login_admin", { email: admin.email }, req);

  console.log("login api result", { ok: true, admin_id: admin.id, email: admin.email, role: admin.role });
  return json(res, 200, { admin, token });
}
