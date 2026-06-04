# Lucky Arcade

Website production-ready untuk Lucky Spin dan Mesin Capit dengan halaman member, login admin, dan dashboard admin berbasis Supabase.

## Fitur

- `/` untuk member Lucky Spin dan redeem voucher.
- `/claw` untuk member Mesin Capit dan redeem voucher.
- `/login` untuk login admin.
- `/admin` protected dashboard.
- Superadmin bisa tambah admin, ubah role, reset password, dan menonaktifkan admin.
- Role admin tersedia: `superadmin`, `admin`, dan `viewer`. Viewer hanya bisa melihat dashboard.
- Semua hasil permainan adalah hadiah menang. Tidak ada hadiah zonk, lose, atau coba lagi.
- Voucher hanya dipakai satu kali melalui RPC `redeem_voucher` yang atomic.
- RPC hanya memilih prize aktif dengan `prize_status = 'win'`.
- Content Settings menyimpan logo, favicon, background spin, background claw, wheel, dan audio URL dari Supabase.
- Password admin di-hash dengan bcrypt/pgcrypto, tidak plaintext.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di API server-side.

## Install

```bash
npm install
```

## Setup Supabase

1. Buat project Supabase baru.
2. Buka SQL Editor.
3. Jalankan isi `supabase/schema.sql`.
4. Jalankan isi `supabase/seed.sql`.
5. Schema akan membuat bucket storage `prize-images`, `content-assets`, dan `audio-assets`.
6. Ambil `Project URL`, `anon key`, dan `service_role key` dari Supabase settings.

Default superadmin dari seed:

- Email: `admin@admin.com`
- Password: `admin123`

Segera ganti password setelah login pertama.

Seed hadiah sengaja tidak menyertakan `ZONK / COBA LAGI`. Kolom `prize_status` di database juga dikunci hanya menerima nilai `win`, sehingga admin tidak bisa membuat hadiah bertipe kalah dari dashboard.

Untuk membuat hash password manual di SQL Supabase:

```sql
select crypt('password-baru', gen_salt('bf', 12));
```

## Environment

Copy `.env.example` menjadi `.env`, lalu isi:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-server-side-only
ADMIN_JWT_SECRET=change-this-long-random-secret
```

## Menjalankan Lokal

```bash
npm run dev
```

Buka `http://127.0.0.1:5173`.

Route member:

- `http://127.0.0.1:5173/` untuk Lucky Spin.
- `http://127.0.0.1:5173/claw` untuk Mesin Capit.
- `http://127.0.0.1:5173/login` untuk admin.

## Deploy ke Vercel

1. Push project ini ke GitHub.
2. Import repository ke Vercel.
3. Tambahkan env yang sama seperti `.env.example` di Vercel Project Settings.
4. Deploy.

Vercel akan menjalankan `npm run build`, memakai folder output `dist`, dan route `/api/*` akan memakai serverless functions.

## Catatan Keamanan

- Jangan pernah memasukkan `SUPABASE_SERVICE_ROLE_KEY` ke frontend.
- Admin biasa tidak melihat menu Admin Management.
- Hapus admin di dashboard dilakukan sebagai `is_active=false` agar riwayat/log tetap aman.
- Untuk production yang lebih ketat, aktifkan RLS sesuai kebutuhan dan biarkan operasi penting melalui API server-side/RPC.

## Mengganti Aset

1. Upload file baru ke bucket Supabase Storage `content-assets` atau `audio-assets`.
2. Copy public URL file tersebut.
3. Login ke `/admin`.
4. Buka menu `Content`.
5. Paste URL ke field logo/background/wheel/audio yang sesuai, lalu simpan.

Placeholder lokal tersedia di `public/assets`:

- `logo.png`
- `favicon.png`
- `spin-background.jpg`
- `claw-background.jpg`
- `wheel.png`
