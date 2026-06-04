import { addLog, adminClient, json, method, requireAdmin } from "./_shared.js";

function code(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function uniqueCodes(supabase, count) {
  const set = new Set();
  while (set.size < count) set.add(code());
  const candidates = [...set];
  const { data } = await supabase.from("vouchers").select("code").in("code", candidates);
  const existing = new Set((data || []).map((row) => row.code));
  return candidates.filter((item) => !existing.has(item));
}

export default async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { action, payload = {} } = req.body || {};
  const supabase = adminClient();

  if (admin.role === "viewer") {
    return json(res, 403, { error: "Viewer hanya boleh melihat dashboard." });
  }

  try {
    if (action === "generate_vouchers") {
      const count = Math.min(Math.max(Number(payload.count || 1), 1), 500);
      const gameType = ["spin", "claw", "both"].includes(payload.game_type) ? payload.game_type : "both";
      let codes = [];
      while (codes.length < count) codes = [...codes, ...(await uniqueCodes(supabase, count - codes.length))];
      const rows = codes.map((voucherCode) => ({ code: voucherCode, game_type: gameType, status: "unused", created_by: admin.id }));
      const { data, error } = await supabase.from("vouchers").insert(rows).select("*");
      if (error) throw error;
      await addLog(supabase, admin.id, "generate_voucher", { count, game_type: gameType }, req);
      return json(res, 200, { data });
    }

    if (action === "void_voucher") {
      const { error } = await supabase.from("vouchers").update({ status: "void" }).eq("id", payload.id).eq("status", "unused");
      if (error) throw error;
      await addLog(supabase, admin.id, "void_voucher", { id: payload.id }, req);
      return json(res, 200, { ok: true });
    }

    if (action === "save_prize") {
      const row = {
        name: payload.name,
        grade: payload.grade || "A",
        image_url: payload.image_url || null,
        emoji: payload.emoji || "🎁",
        color: payload.color || "#FFD700",
        probability: Number(payload.probability || 1),
        prize_status: "win",
        stock: payload.stock === "" || payload.stock === undefined || payload.stock === null ? null : Number(payload.stock),
        active: payload.active !== false,
        sorter: Number(payload.sorter || 0)
      };
      const query = payload.id
        ? supabase.from("prizes").update(row).eq("id", payload.id).select("*").single()
        : supabase.from("prizes").insert(row).select("*").single();
      const { data, error } = await query;
      if (error) throw error;
      await addLog(supabase, admin.id, payload.id ? "edit_prize" : "add_prize", { id: data.id, name: data.name }, req);
      return json(res, 200, { data });
    }

    if (action === "deactivate_prize") {
      const { error } = await supabase.from("prizes").update({ active: false }).eq("id", payload.id);
      if (error) throw error;
      await addLog(supabase, admin.id, "deactivate_prize", { id: payload.id }, req);
      return json(res, 200, { ok: true });
    }

    if (action === "claim_status") {
      const status = ["pending", "claimed", "cancelled"].includes(payload.status) ? payload.status : "pending";
      const { error } = await supabase.from("play_history").update({ claim_status: status }).eq("id", payload.id);
      if (error) throw error;
      await addLog(supabase, admin.id, "update_claim_status", { id: payload.id, status }, req);
      return json(res, 200, { ok: true });
    }

    if (action === "save_content") {
      const row = {
        label: payload.label || payload.key,
        value: payload.value || "",
        asset_type: ["image", "audio", "text"].includes(payload.asset_type) ? payload.asset_type : "image",
        is_active: payload.is_active !== false,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from("contents")
        .update(row)
        .eq("key", payload.key)
        .select("*")
        .single();
      if (error) throw error;
      await addLog(supabase, admin.id, "update_content_setting", { key: data.key, value: data.value }, req);
      return json(res, 200, { data });
    }

    if (action === "save_site_setting") {
      const { data, error } = await supabase
        .from("site_settings")
        .update({ value: payload.value || {}, is_active: payload.is_active !== false, updated_at: new Date().toISOString() })
        .eq("key", payload.key || "site")
        .select("*")
        .single();
      if (error) throw error;
      await addLog(supabase, admin.id, "update_site_setting", { key: data.key }, req);
      return json(res, 200, { data });
    }

    if (["add_admin", "update_admin", "deactivate_admin", "reset_admin_password"].includes(action)) {
      const superadmin = await requireAdmin(req, res, true);
      if (!superadmin) return;

      if (action === "add_admin") {
        const role = ["superadmin", "admin", "viewer"].includes(payload.role) ? payload.role : "admin";
        const { data: password_hash, error: hashError } = await supabase.rpc("hash_admin_password", { p_password: payload.password || "" });
        if (hashError) throw hashError;
        const row = {
          name: payload.name,
          email: String(payload.email || "").toLowerCase().trim(),
          password_hash,
          role,
          is_active: true
        };
        if (!row.name || !row.email || !payload.password) return json(res, 400, { error: "Nama, email, dan password wajib diisi." });
        const { data, error } = await supabase.from("admins").insert(row).select("id,name,email,role,is_active,created_at").single();
        if (error) throw error;
        await addLog(supabase, admin.id, "add_admin", { id: data.id, email: data.email, role: data.role }, req);
        return json(res, 200, { data });
      }

      if (action === "update_admin") {
        if (payload.id === admin.id && payload.role !== "superadmin") return json(res, 400, { error: "Tidak bisa menurunkan role akun sendiri." });
        const role = ["superadmin", "admin", "viewer"].includes(payload.role) ? payload.role : "admin";
        const { data, error } = await supabase
          .from("admins")
          .update({ name: payload.name, role, is_active: payload.is_active !== false })
          .eq("id", payload.id)
          .select("id,name,email,role,is_active,created_at")
          .single();
        if (error) throw error;
        await addLog(supabase, admin.id, "edit_admin", { id: data.id, role: data.role, is_active: data.is_active }, req);
        return json(res, 200, { data });
      }

      if (action === "deactivate_admin") {
        if (payload.id === admin.id) return json(res, 400, { error: "Tidak bisa menonaktifkan akun sendiri." });
        const { data: target } = await supabase.from("admins").select("id,role").eq("id", payload.id).single();
        if (target?.role === "superadmin" && admin.role !== "superadmin") return json(res, 403, { error: "Admin biasa tidak boleh menghapus superadmin." });
        const { error } = await supabase.from("admins").update({ is_active: false }).eq("id", payload.id);
        if (error) throw error;
        await addLog(supabase, admin.id, "deactivate_admin", { id: payload.id }, req);
        return json(res, 200, { ok: true });
      }

      if (action === "reset_admin_password") {
        if (!payload.password) return json(res, 400, { error: "Password baru wajib diisi." });
        const { data: password_hash, error: hashError } = await supabase.rpc("hash_admin_password", { p_password: payload.password });
        if (hashError) throw hashError;
        const { error } = await supabase.from("admins").update({ password_hash }).eq("id", payload.id);
        if (error) throw error;
        await addLog(supabase, admin.id, "reset_admin_password", { id: payload.id }, req);
        return json(res, 200, { ok: true });
      }
    }

    return json(res, 400, { error: "Aksi tidak dikenal." });
  } catch (error) {
    return json(res, 500, { error: error.message || "Aksi gagal." });
  }
}
