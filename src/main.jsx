import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const COLORS = ["#FFD700", "#FF006E", "#00D4FF", "#FF8C00", "#9B59B6", "#27AE60", "#E74C3C", "#3498DB"];
const DEFAULT_CONTENT = {
  logo: "/assets/logo.png",
  favicon: "/assets/favicon.png",
  spin_background: "/assets/spin-background.jpg",
  claw_background: "/assets/claw-background.jpg",
  wheel_image: "/assets/wheel.png"
};

async function api(path, options = {}) {
  const token = localStorage.getItem("admin_session");
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    credentials: "include"
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request gagal.");
  return data;
}

function fmtDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function contentMap(contents = []) {
  return contents.reduce((acc, item) => {
    if (item?.key && item?.value) acc[item.key] = item.value;
    return acc;
  }, { ...DEFAULT_CONTENT });
}

function Button({ children, variant = "gold", ...props }) {
  return <button className={`btn ${variant}`} {...props}>{children}</button>;
}

function Field(props) {
  return <input className="field" {...props} />;
}

function Select(props) {
  return <select className="field" {...props} />;
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(onClose, 3200);
    return () => clearTimeout(id);
  }, [toast, onClose]);
  if (!toast) return null;
  return <div className={`toast ${toast.type || ""}`}>{toast.message}</div>;
}

function SpinWheel({ prizes, targetId, spinning, onDone, wheelImage }) {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const active = prizes.slice(0, 8);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active.length) return;
    const ctx = canvas.getContext("2d");
    const draw = (rotation = 0) => {
      const size = canvas.width;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 8;
      const seg = 360 / active.length;
      ctx.clearRect(0, 0, size, size);
      active.forEach((prize, index) => {
        const start = ((index * seg - 90 + rotation) * Math.PI) / 180;
        const end = (((index + 1) * seg - 90 + rotation) * Math.PI) / 180;
        const mid = (start + end) / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = prize.color || COLORS[index % COLORS.length];
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,.42)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(mid);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = "700 13px Rajdhani";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 5;
        ctx.fillText((prize.name || "Hadiah").slice(0, 15), radius - 14, 5);
        ctx.font = "20px serif";
        ctx.fillText(prize.emoji || "🎁", radius - 16, -14);
        ctx.restore();
      });
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD700";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#101026";
      ctx.font = "22px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★", cx, cy);
    };
    draw(rotationRef.current);
    if (!spinning) return;
    const targetIndex = Math.max(0, active.findIndex((p) => p.id === targetId));
    const seg = 360 / active.length;
    const start = rotationRef.current;
    const target = start + 1800 + (360 - (targetIndex * seg + seg / 2));
    let startTime = 0;
    let frame = 0;
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / 4600, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = start + (target - start) * ease;
      draw(current % 360);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else {
        rotationRef.current = target % 360;
        onDone();
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active, spinning, targetId, onDone]);

  return (
    <div className="wheelWrap">
      <div className="pointer" />
      {wheelImage && <img src={wheelImage} alt="" className="wheelAsset" />}
      <canvas ref={canvasRef} width="320" height="320" className="wheel" />
    </div>
  );
}

function ClawMachine({ prize, playing, onPlay }) {
  return (
    <div className={`claw ${playing ? "playing" : ""}`}>
      <div className="clawTop" />
      <div className="clawCable" />
      <div className="clawHand">⌄</div>
      <div className="toyShelf">
        {["💎", "🎁", "🪙", "🎟️", "📱", "💵", "⭐", "🏆"].map((item, index) => (
          <span key={index} style={{ "--x": `${8 + (index % 4) * 25}%`, "--y": `${55 + Math.floor(index / 4) * 20}%` }}>{item}</span>
        ))}
      </div>
      <Button disabled={playing || !prize} onClick={onPlay}>MULAI CAPIT</Button>
    </div>
  );
}

function Landing() {
  return (
    <main className="landing">
      <section className="hero">
        <p className="eyebrow">LUCKY SPIN + MESIN CAPIT</p>
        <h1>LUCKY ARCADE</h1>
        <p className="lede">Masukkan kode voucher, pilih permainan, lalu screenshot hadiah untuk klaim ke admin.</p>
        <div className="gameGrid">
          <a className="gameTile spin" href="/?game=spin">
            <span>🎡</span>
            <strong>Lucky Spin</strong>
            <small>Roda hadiah neon dengan peluang aktif dari database.</small>
          </a>
          <a className="gameTile clawTile" href="/?game=claw">
            <span>🕹️</span>
            <strong>Mesin Capit</strong>
            <small>Capit hadiah arcade, voucher tetap dipakai satu kali.</small>
          </a>
        </div>
      </section>
    </main>
  );
}

function MemberGame({ showToast, forcedGame }) {
  const params = new URLSearchParams(window.location.search);
  const game = forcedGame || params.get("game") || "spin";
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState("entry");
  const [result, setResult] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [publicData, setPublicData] = useState({ contents: [], settings: [] });
  const assets = contentMap(publicData.contents);
  const site = publicData.settings?.find((item) => item.key === "site")?.value || {};

  useEffect(() => {
    api("/api/public-settings").then(setPublicData).catch(() => {});
    api("/api/visitor-log", { method: "POST", body: JSON.stringify({ path: window.location.pathname }) }).catch(() => {});
  }, []);

  if (!["spin", "claw"].includes(game)) return <Landing />;

  const redeem = async () => {
    if (!code.trim()) return showToast("Masukkan kode voucher dulu.", "error");
    try {
      setState("loading");
      const data = await api("/api/redeem-voucher", {
        method: "POST",
        body: JSON.stringify({ code, gameType: game, memberNote: note })
      });
      setResult(data);
      if (game === "spin") {
        setState("spin");
        setSpinning(true);
      } else {
        setState("claw");
      }
    } catch (error) {
      setState("entry");
      showToast(error.message, "error");
    }
  };

  const done = () => {
    setSpinning(false);
    setState("result");
  };

  const playClaw = () => {
    setPlaying(true);
    setTimeout(() => {
      setPlaying(false);
      setState("result");
    }, 2400);
  };

  if (state === "spin" && result) {
    return <GameShell title="LUCKY SPIN" code={code} assets={assets} game={game}><SpinWheel prizes={result.prizes || [result.prize]} targetId={result.prize.id} spinning={spinning} onDone={done} wheelImage={assets.wheel_image} /></GameShell>;
  }
  if (state === "claw" && result) {
    return <GameShell title="MESIN CAPIT" code={code} assets={assets} game={game}><ClawLayout prizes={result.prizes || [result.prize]}><ClawMachine prize={result.prize} playing={playing} onPlay={playClaw} /></ClawLayout></GameShell>;
  }
  if (state === "result" && result) {
    return (
      <main className="gamePage">
        <div className="resultBox">
          <p className="eyebrow">SELAMAT</p>
          <div className="prizeEmoji">{result.prize.emoji || "🎁"}</div>
          <h1>{result.prize.name}</h1>
          <p>Kode voucher <strong>{String(code).toUpperCase()}</strong> sudah berhasil dipakai. Screenshot halaman ini lalu kirim ke admin untuk proses klaim.</p>
          <Button onClick={() => window.location.href = "/"}>Kembali ke Beranda</Button>
        </div>
      </main>
    );
  }

  return (
    <main className={`gamePage ${game === "spin" ? "spinMember" : "clawMember"}`} style={{ backgroundImage: `linear-gradient(rgba(8,8,24,.64),rgba(8,8,24,.82)), url(${game === "spin" ? assets.spin_background : assets.claw_background})` }}>
      <div className="memberStage">
        <div className="memberVisual">
          {game === "spin" ? <SpinWheel prizes={[{ name: "Hadiah", emoji: "🎁", color: "#FFD700" }, { name: "Voucher", emoji: "🎟️", color: "#00D4FF" }, { name: "Bonus", emoji: "💰", color: "#FF006E" }]} wheelImage={assets.wheel_image} /> : <ClawLayout prizes={[]}><ClawMachine prize={{ name: "Hadiah" }} playing={false} onPlay={() => showToast("Masukkan voucher dulu.", "error")} /></ClawLayout>}
        </div>
        <div className="ticketBox">
          <img src={assets.logo} alt={site.name || "Lucky Arcade"} className="brandLogo" />
        <a className="back" href={game === "claw" ? "/" : "/claw"}>{game === "claw" ? "← Lucky Spin" : "Mesin Capit →"}</a>
        <p className="eyebrow">{game === "spin" ? "LUCKY SPIN" : "MESIN CAPIT"} · SEMUA HADIAH MENANG</p>
        <h1>{site.name || "Masukkan Voucher"}</h1>
        <p className="muted">{site.memberNote || "Masukkan voucher dan mainkan arcade. Semua hasil adalah hadiah menang."}</p>
        <Field value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="KODE TIKET" maxLength={16} />
        <Field value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan member, opsional" />
        <Button disabled={state === "loading"} onClick={redeem}>{state === "loading" ? "MEMERIKSA..." : "VALIDASI & MAIN"}</Button>
        </div>
      </div>
    </main>
  );
}

function ClawLayout({ prizes, children }) {
  return (
    <div className="clawLayout">
      <aside className="clawMenu"><span>SPIN</span><span>CLAW</span><span>GIFT</span></aside>
      {children}
      <aside className="gradeList">
        <strong>GRADE</strong>
        {(prizes.length ? prizes : [{ grade: "S", name: "Grand Prize" }, { grade: "A", name: "Hadiah Utama" }, { grade: "B", name: "Bonus" }]).slice(0, 6).map((p, i) => <p key={i}><b>{p.grade || "A"}</b>{p.name}</p>)}
      </aside>
    </div>
  );
}

function GameShell({ title, code, children, assets = DEFAULT_CONTENT, game = "spin" }) {
  return (
    <main className="gamePage" style={{ backgroundImage: `linear-gradient(rgba(8,8,24,.7),rgba(8,8,24,.86)), url(${game === "spin" ? assets.spin_background : assets.claw_background})` }}>
      <a className="back floating" href="/">← Kembali</a>
      <p className="eyebrow">Tiket {String(code).toUpperCase()}</p>
      <h1 className="gameTitle">{title}</h1>
      {children}
    </main>
  );
}

function Login({ showToast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
      console.log("login api result", { ok: true, admin: result.admin });
      if (!result.token) throw new Error("Login berhasil, tetapi token session tidak diterima.");
      localStorage.setItem("admin_session", result.token);
      console.log("session saved", { key: "admin_session", hasToken: true });
      window.location.href = "/admin";
    } catch (error) {
      console.log("login api result", { ok: false, error: error.message });
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="loginPage">
      <form className="loginBox" onSubmit={submit}>
        <p className="eyebrow">ADMIN ONLY</p>
        <h1>Login Dashboard</h1>
        <Field type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@email.com" />
        <Field type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <Button disabled={loading}>{loading ? "MASUK..." : "MASUK"}</Button>
      </form>
    </main>
  );
}

function Admin({ showToast }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState("overview");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_session");
      console.log("protected route session check", { path: "/admin", hasToken: Boolean(token) });
      const dashboardData = await api("/api/admin-data");
      console.log("protected route session check", { path: "/admin", valid: true, admin: dashboardData.admin });
      setData(dashboardData);
    } catch (error) {
      console.log("protected route session check", { path: "/admin", valid: false, error: error.message });
      localStorage.removeItem("admin_session");
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const action = async (name, payload, success = "Berhasil disimpan.") => {
    try {
      await api("/api/admin-action", { method: "POST", body: JSON.stringify({ action: name, payload }) });
      showToast(success);
      await load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const logout = async () => {
    await api("/api/auth-login", { method: "DELETE" });
    localStorage.removeItem("admin_session");
    window.location.href = "/login";
  };

  if (loading) return <main className="adminLoading">LOADING...</main>;
  if (!data) return null;

  const nav = [
    ["overview", "Dashboard"],
    ["vouchers", "Voucher"],
    ["prizes", "Hadiah"],
    ["history", "Pemenang"],
    ...(data.admin.role === "superadmin" ? [["admins", "Admin Management"]] : []),
    ["content", "Content"],
    ["settings", "Settings"],
    ["logs", "Admin Logs"]
  ];

  return (
    <main className="adminShell">
      <aside>
        <h2>LUCKY ARCADE</h2>
        <p>{data.admin.name} · {data.admin.role}</p>
        <nav>{nav.map(([id, label]) => <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>{label}</button>)}</nav>
        <button className="logout" onClick={logout}>Logout</button>
      </aside>
      <section className="adminContent">
        {page === "overview" && <Overview data={data} />}
        {page === "vouchers" && <Vouchers data={data} action={action} />}
        {page === "prizes" && <Prizes data={data} action={action} />}
        {page === "history" && <History data={data} action={action} />}
        {page === "admins" && data.admin.role === "superadmin" && <Admins data={data} action={action} />}
        {page === "content" && <Content data={data} action={action} />}
        {page === "settings" && <Settings data={data} action={action} />}
        {page === "logs" && <Logs logs={data.logs} />}
      </section>
    </main>
  );
}

function Overview({ data }) {
  const unused = data.vouchers.filter((v) => v.status === "unused").length;
  const used = data.vouchers.filter((v) => v.status === "used").length;
  const voided = data.vouchers.filter((v) => v.status === "void").length;
  const today = new Date().toISOString().slice(0, 10);
  const todayPlays = data.history.filter((h) => String(h.played_at || "").startsWith(today)).length;
  return (
    <div>
      <Header title="Dashboard" subtitle="Ringkasan voucher, hadiah keluar, dan pemenang terbaru." />
      <div className="stats">
        <Stat label="Total Voucher" value={data.vouchers.length} />
        <Stat label="Belum Dipakai" value={unused} />
        <Stat label="Sudah Dipakai" value={used} />
        <Stat label="Void" value={voided} />
        <Stat label="Play Hari Ini" value={todayPlays} />
        <Stat label="Pengunjung" value={data.visitors?.length || 0} />
        <Stat label="Hadiah Keluar" value={data.history.length} />
      </div>
      <Table cols={["Voucher", "Game", "Hadiah", "Waktu"]} rows={data.history.slice(0, 8).map((h) => [h.voucher_code, h.game_type, `${h.prize_emoji || ""} ${h.prize_name}`, fmtDate(h.played_at)])} />
    </div>
  );
}

function Vouchers({ data, action }) {
  const [count, setCount] = useState(1);
  const [gameType, setGameType] = useState("both");
  const [query, setQuery] = useState("");
  const filtered = data.vouchers.filter((v) => `${v.code} ${v.game_type} ${v.status}`.toLowerCase().includes(query.toLowerCase()));
  const exportCsv = () => {
    const rows = [["code", "game_type", "status", "used_prize_name", "created_at"], ...data.vouchers.map((v) => [v.code, v.game_type, v.status, v.used_prize_name || "", v.created_at])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "lucky-arcade-vouchers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <Header title="Voucher / Tiket" subtitle="Generate, copy, export, dan void voucher." />
      <div className="toolbar">
        <Field type="number" min="1" max="500" value={count} onChange={(e) => setCount(e.target.value)} />
        <Select value={gameType} onChange={(e) => setGameType(e.target.value)}><option value="both">Both</option><option value="spin">Spin</option><option value="claw">Claw</option></Select>
        <Button onClick={() => action("generate_vouchers", { count, game_type: gameType }, "Voucher berhasil dibuat.")}>Generate</Button>
        <Button variant="blue" onClick={exportCsv}>Export CSV</Button>
        <Field placeholder="Search voucher" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <Table cols={["Kode", "Game", "Status", "Dibuat", "Dipakai", "Hadiah", "Aksi"]} rows={filtered.map((v) => [
        <code>{v.code}</code>,
        v.game_type,
        <span className={`pill ${v.status}`}>{v.status}</span>,
        fmtDate(v.created_at),
        fmtDate(v.used_at),
        v.used_prize_name || "-",
        <div className="rowActions"><button onClick={() => navigator.clipboard.writeText(v.code)}>Copy</button>{v.status === "unused" && <button onClick={() => action("void_voucher", { id: v.id }, "Voucher dinonaktifkan.")}>Void</button>}</div>
      ])} />
    </div>
  );
}

function Prizes({ data, action }) {
  const [form, setForm] = useState({ name: "", grade: "A", image_url: "", emoji: "🎁", color: "#FFD700", probability: 1, stock: "", sorter: 0, active: true });
  const edit = (p) => setForm({ ...p, stock: p.stock ?? "" });
  const save = () => action("save_prize", form, "Hadiah menang berhasil disimpan.").then(() => setForm({ name: "", grade: "A", image_url: "", emoji: "🎁", color: "#FFD700", probability: 1, stock: "", sorter: 0, active: true }));
  return (
    <div>
      <Header title="Hadiah" subtitle="Semua hadiah adalah win. Tidak ada opsi zonk, lose, atau coba lagi." />
      <div className="formGrid">
        <Field placeholder="Nama hadiah" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Field placeholder="Grade" value={form.grade || ""} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
        <Field placeholder="Image URL opsional" value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <Field placeholder="Emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <Field type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        <Field type="number" min="1" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} />
        <Field type="number" min="0" placeholder="Stock kosong = unlimited" value={form.stock ?? ""} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <Field type="number" min="0" placeholder="Urutan" value={form.sorter || 0} onChange={(e) => setForm({ ...form, sorter: e.target.value })} />
        <Button onClick={save}>Simpan Hadiah</Button>
      </div>
      <div className="cardGrid">{data.prizes.map((p) => <article className="prizeCard" key={p.id} style={{ borderColor: `${p.color}55` }}>
        <div className="emoji">{p.emoji}</div><h3>{p.name}</h3><p>Grade {p.grade || "A"} · Win · Bobot {p.probability} · Stock {p.stock ?? "∞"} · {p.active ? "aktif" : "nonaktif"}</p>
        <div className="rowActions"><button onClick={() => edit(p)}>Edit</button><button onClick={() => action("deactivate_prize", { id: p.id }, "Hadiah dinonaktifkan.")}>Nonaktif</button></div>
      </article>)}</div>
    </div>
  );
}

function History({ data, action }) {
  return (
    <div>
      <Header title="History Pemenang" subtitle="Ubah status klaim hadiah member." />
      <Table cols={["Voucher", "Game", "Hadiah", "Waktu", "Klaim"]} rows={data.history.map((h) => [
        h.voucher_code,
        h.game_type,
        `${h.prize_emoji || ""} ${h.prize_name}`,
        fmtDate(h.played_at),
        <Select value={h.claim_status} onChange={(e) => action("claim_status", { id: h.id, status: e.target.value }, "Status klaim diperbarui.")}><option value="pending">pending</option><option value="claimed">claimed</option><option value="cancelled">cancelled</option></Select>
      ])} />
    </div>
  );
}

function Admins({ data, action }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const save = () => action("add_admin", form, "Admin baru berhasil ditambahkan.").then(() => setForm({ name: "", email: "", password: "", role: "admin" }));
  const resetPassword = (id) => {
    const password = window.prompt("Password baru admin:");
    if (password) action("reset_admin_password", { id, password }, "Password admin direset.");
  };
  return (
    <div>
      <Header title="Admin Management" subtitle="Khusus superadmin: tambah, ubah role, reset password, dan nonaktifkan admin." />
      <div className="formGrid">
        <Field placeholder="Nama admin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Field type="email" placeholder="email@domain.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field type="password" placeholder="Password awal" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="admin">Admin</option><option value="viewer">Viewer</option><option value="superadmin">Superadmin</option></Select>
        <Button onClick={save}>Tambah Admin</Button>
      </div>
      <div className="cardGrid">{data.admins.map((admin) => <article className={`adminCard ${!admin.is_active ? "off" : ""}`} key={admin.id}>
        <h3>{admin.name}</h3><p>{admin.email}</p>
        <Select value={admin.role} onChange={(e) => action("update_admin", { id: admin.id, name: admin.name, role: e.target.value, is_active: admin.is_active }, "Role admin diperbarui.")}><option value="admin">admin</option><option value="viewer">viewer</option><option value="superadmin">superadmin</option></Select>
        <div className="rowActions"><button onClick={() => resetPassword(admin.id)}>Reset Password</button>{admin.id !== data.admin.id && admin.is_active && <button onClick={() => action("deactivate_admin", { id: admin.id }, "Admin dinonaktifkan.")}>Nonaktifkan</button>}</div>
      </article>)}</div>
    </div>
  );
}

function Content({ data, action }) {
  const [forms, setForms] = useState(() => Object.fromEntries((data.contents || []).map((item) => [item.key, item])));
  const update = (key, patch) => setForms((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  return (
    <div>
      <Header title="Content" subtitle="Ganti logo, background, wheel, dan asset audio dari URL Supabase Storage atau public assets." />
      <div className="contentGrid">
        {(data.contents || []).map((item) => {
          const form = forms[item.key] || item;
          return (
            <article className="contentCard" key={item.key}>
              <div>
                <h3>{item.label}</h3>
                <p>{item.key} · {item.asset_type}</p>
              </div>
              {form.asset_type === "image" && form.value && <img src={form.value} alt="" />}
              <Field value={form.value || ""} onChange={(e) => update(item.key, { value: e.target.value })} placeholder="/assets/logo.png atau URL Supabase Storage" />
              <label className="checkRow"><input type="checkbox" checked={form.is_active !== false} onChange={(e) => update(item.key, { is_active: e.target.checked })} /> Aktif</label>
              <Button onClick={() => action("save_content", form, "Content diperbarui.")}>Simpan</Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Settings({ data, action }) {
  const site = data.settings?.find((item) => item.key === "site") || { key: "site", value: {} };
  const [name, setName] = useState(site.value?.name || "Lucky Arcade");
  const [memberNote, setMemberNote] = useState(site.value?.memberNote || "");
  return (
    <div>
      <Header title="Settings" subtitle="Pengaturan nama website dan teks member." />
      <div className="settingsPanel">
        <Field value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama website" />
        <Field value={memberNote} onChange={(e) => setMemberNote(e.target.value)} placeholder="Catatan member" />
        <Button onClick={() => action("save_site_setting", { key: "site", value: { name, memberNote }, is_active: true }, "Settings diperbarui.")}>Simpan Settings</Button>
      </div>
    </div>
  );
}

function Logs({ logs }) {
  return (
    <div>
      <Header title="Admin Logs" subtitle="Catatan aksi penting dashboard." />
      <Table cols={["Aksi", "IP", "URL", "Detail", "Waktu"]} rows={logs.map((log) => [log.action, log.ip_address || "-", log.url || "-", <code>{JSON.stringify(log.detail || {})}</code>, fmtDate(log.created_at)])} />
    </div>
  );
}

function Header({ title, subtitle }) {
  return <header className="sectionHead"><h1>{title}</h1><p>{subtitle}</p></header>;
}

function Stat({ label, value }) {
  return <article className="stat"><span>{label}</span><strong>{value}</strong></article>;
}

function Table({ cols, rows }) {
  return (
    <div className="tableWrap">
      {rows.length === 0 ? <p className="empty">Belum ada data.</p> : <table><thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table>}
    </div>
  );
}

function App() {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const path = window.location.pathname;
  const page = useMemo(() => {
    if (path === "/login") return <Login showToast={showToast} />;
    if (path === "/admin") return <Admin showToast={showToast} />;
    if (path === "/claw") return <MemberGame showToast={showToast} forcedGame="claw" />;
    return <MemberGame showToast={showToast} forcedGame="spin" />;
  }, [path]);
  return <>{page}<Toast toast={toast} onClose={() => setToast(null)} /></>;
}

createRoot(document.getElementById("root")).render(<App />);
