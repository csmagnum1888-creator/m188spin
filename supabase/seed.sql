insert into admins (name, email, password_hash, role, is_active)
values (
  'Super Admin',
  'admin@admin.com',
  crypt('admin123', gen_salt('bf', 12)),
  'superadmin',
  true
)
on conflict (email) do nothing;

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
