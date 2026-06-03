# Lucky Arcade

Website production-ready untuk Lucky Spin dan Mesin Capit dengan halaman member, login admin, dan dashboard admin berbasis Supabase.

## Fitur

- `/` untuk member memilih game dan redeem voucher.
- `/login` untuk login admin.
- `/admin` protected dashboard.
- Superadmin bisa tambah admin, ubah role, reset password, dan menonaktifkan admin.
- Voucher hanya dipakai satu kali melalui RPC `redeem_voucher` yang atomic.
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
5. Ambil `Project URL`, `anon key`, dan `service_role key` dari Supabase settings.

Default superadmin dari seed:

- Email: `admin@admin.com`
- Password: `admin123`

Segera ganti password setelah login pertama.

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
