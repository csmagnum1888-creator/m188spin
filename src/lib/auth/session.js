export async function currentAdmin() {
  const res = await fetch("/api/auth-me", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export async function logoutAdmin() {
  return fetch("/api/auth-login", { method: "DELETE", credentials: "include" });
}
