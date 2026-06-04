export async function redeemVoucher({ code, gameType, memberNote }) {
  const res = await fetch("/api/redeem-voucher", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, gameType, memberNote })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Voucher gagal diproses.");
  return data;
}
