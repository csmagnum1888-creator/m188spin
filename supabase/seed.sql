insert into admins (name, email, password_hash, role, is_active)
values (
  'Super Admin',
  'admin@admin.com',
  crypt('admin123', gen_salt('bf', 12)),
  'superadmin',
  true
)
on conflict (email) do update set
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  is_active = true;

insert into prizes (name, grade, emoji, color, probability, prize_status, stock, active, sorter) values
  ('Honda PCX 160', 'S', '🏍️', '#FFD700', 1, 'win', 1, true, 1),
  ('iPhone 15 Pro', 'S', '📱', '#FF006E', 1, 'win', 1, true, 2),
  ('TV Samsung 65"', 'A', '📺', '#00D4FF', 2, 'win', 2, true, 3),
  ('Rp 1.000.000', 'A', '💰', '#FF8C00', 5, 'win', 5, true, 4),
  ('Rp 500.000', 'B', '💵', '#9B59B6', 8, 'win', 10, true, 5),
  ('Rp 100.000', 'B', '💴', '#27AE60', 12, 'win', null, true, 6),
  ('Rp 50.000', 'C', '💸', '#E74C3C', 18, 'win', null, true, 7),
  ('Rp 10.000', 'C', '🎟️', '#3498DB', 23, 'win', null, true, 8)
on conflict do nothing;

insert into contents (key, label, value, asset_type, is_active) values
  ('logo', 'Logo', '/assets/logo.png', 'image', true),
  ('favicon', 'Favicon', '/assets/favicon.png', 'image', true),
  ('spin_background', 'Background Lucky Spin', '/assets/spin-background.jpg', 'image', true),
  ('claw_background', 'Background Mesin Capit', '/assets/claw-background.jpg', 'image', true),
  ('wheel_image', 'Wheel Image', '/assets/wheel.png', 'image', true),
  ('pointer_image', 'Pointer Image', '', 'image', true),
  ('music_background', 'Music Background', '', 'audio', false),
  ('sound_spin', 'Sound Spin', '', 'audio', false),
  ('sound_win', 'Sound Win', '', 'audio', false)
on conflict (key) do nothing;

insert into site_settings (key, value, is_active) values
  ('site', '{"name":"Lucky Arcade","memberNote":"Semua voucher menghasilkan hadiah menang. Screenshot hasil untuk klaim ke admin."}'::jsonb, true)
on conflict (key) do nothing;
