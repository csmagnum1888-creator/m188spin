insert into admins (name, email, password_hash, role, is_active)
values (
  'Super Admin',
  'admin@admin.com',
  crypt('admin123', gen_salt('bf', 12)),
  'superadmin',
  true
)
on conflict (email) do nothing;

insert into prizes (name, emoji, color, probability, stock, active) values
  ('Honda PCX 160', '🏍️', '#FFD700', 1, 1, true),
  ('iPhone 15 Pro', '📱', '#FF006E', 1, 1, true),
  ('TV Samsung 65"', '📺', '#00D4FF', 2, 2, true),
  ('Rp 1.000.000', '💰', '#FF8C00', 5, 5, true),
  ('Rp 500.000', '💵', '#9B59B6', 8, 10, true),
  ('Rp 100.000', '💴', '#27AE60', 12, null, true),
  ('Rp 50.000', '💸', '#E74C3C', 18, null, true),
  ('Rp 10.000', '🎟️', '#3498DB', 23, null, true)
on conflict do nothing;
