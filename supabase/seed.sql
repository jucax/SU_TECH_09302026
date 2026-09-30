-- Canonical Jorge's Auto Parts tenant. This is both the live demo tenant used in the
-- pitch/README (never edited directly during judging, per docs/PLAN.md) and the
-- master template that api/demo-start.ts clones from for each visitor session.

insert into tenants (id, slug, name, is_canonical)
values ('00000000-0000-0000-0000-000000000001', 'jorges-auto-parts', 'Jorge''s Auto Parts', true);

insert into products (tenant_id, name, description, price_cents, available, compatibility)
values
  ('00000000-0000-0000-0000-000000000001', 'Front Brake Rotor', 'OEM-spec vented front brake rotor.', 4999, true, '2015-2020 Honda Civic'),
  ('00000000-0000-0000-0000-000000000001', 'Ceramic Brake Pad Set', 'Low-dust ceramic pads, front axle set of 4.', 3499, true, '2015-2020 Honda Civic'),
  ('00000000-0000-0000-0000-000000000001', 'Cabin Air Filter', 'Replacement cabin air filter.', 1299, true, '2012-2022 Honda Civic / Accord'),
  ('00000000-0000-0000-0000-000000000001', 'Serpentine Belt', 'Replacement serpentine drive belt.', 2199, false, '2010-2018 Toyota Corolla'),
  ('00000000-0000-0000-0000-000000000001', 'Oil Filter', 'Standard spin-on oil filter.', 899, true, 'Most 4-cylinder Honda/Toyota engines'),
  ('00000000-0000-0000-0000-000000000001', 'Headlight Assembly (Driver Side)', 'Direct-fit halogen headlight assembly.', 8999, true, '2016-2021 Honda Civic');

insert into hours (tenant_id, day_of_week, opens_at, closes_at, closed)
values
  ('00000000-0000-0000-0000-000000000001', 0, null, null, true),
  ('00000000-0000-0000-0000-000000000001', 1, '08:00', '18:00', false),
  ('00000000-0000-0000-0000-000000000001', 2, '08:00', '18:00', false),
  ('00000000-0000-0000-0000-000000000001', 3, '08:00', '18:00', false),
  ('00000000-0000-0000-0000-000000000001', 4, '08:00', '18:00', false),
  ('00000000-0000-0000-0000-000000000001', 5, '08:00', '19:00', false),
  ('00000000-0000-0000-0000-000000000001', 6, '09:00', '15:00', false);

insert into policies (tenant_id, kind, body)
values
  ('00000000-0000-0000-0000-000000000001', 'returns', 'Unused parts in original packaging may be returned within 30 days with a receipt for a full refund. Electrical parts and special orders are final sale.'),
  ('00000000-0000-0000-0000-000000000001', 'pickup', 'In-store pickup is available same day for in-stock items ordered before 3 PM.'),
  ('00000000-0000-0000-0000-000000000001', 'warranty', 'All parts carry the manufacturer''s standard warranty. Jorge''s Auto Parts offers a 90-day workmanship guarantee on any installation performed in-store.');
