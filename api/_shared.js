import cookie from "cookie";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const cookieName = "lucky_admin_session";

export function json(res, status, body) {
  return res.status(status).json(body);
}

export function method(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    json(res, 405, { error: "Method tidak didukung." });
    return false;
  }
  return true;
}

export function adminClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env Supabase server belum lengkap.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function anonClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Env Supabase public belum lengkap.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function signAdmin(admin) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET belum diisi.");
  return jwt.sign(
    { sub: admin.id, email: admin.email, role: admin.role, name: admin.name },
    secret,
    { expiresIn: "12h" }
  );
}

export function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", cookie.serialize(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  }));
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", cookie.serialize(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  }));
}

export async function requireAdmin(req, res, requireSuperadmin = false) {
  const raw = req.headers.cookie || "";
  const parsed = cookie.parse(raw);
  const token = parsed[cookieName] || req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    json(res, 401, { error: "Silakan login admin." });
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    const supabase = adminClient();
    const { data, error } = await supabase
      .from("admins")
      .select("id,name,email,role,is_active,created_at")
      .eq("id", payload.sub)
      .single();
    if (error || !data || !data.is_active) {
      json(res, 401, { error: "Sesi admin tidak valid." });
      return null;
    }
    if (requireSuperadmin && data.role !== "superadmin") {
      json(res, 403, { error: "Hanya superadmin yang boleh melakukan aksi ini." });
      return null;
    }
    return data;
  } catch {
    json(res, 401, { error: "Sesi admin kedaluwarsa." });
    return null;
  }
}

export async function addLog(supabase, adminId, action, detail = {}) {
  await supabase.from("admin_logs").insert({ admin_id: adminId || null, action, detail });
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
