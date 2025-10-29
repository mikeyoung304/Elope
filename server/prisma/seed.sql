-- Elope Initial Seed Data
-- Run this in Supabase SQL Editor after schema deployment

-- Insert Admin User
-- Password: 'admin' (hashed with bcrypt, cost 10)
INSERT INTO "User" (id, email, name, "passwordHash", role, "createdAt", "updatedAt")
VALUES (
  'clzadmin00000000000000000',
  'admin@example.com',
  'Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye/VLhq8fVJc9GJQI7ZxZTRgE8hYLEr8K',
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert Packages
INSERT INTO "Package" (id, slug, name, description, "basePrice", active, "createdAt", "updatedAt")
VALUES
  (
    'clzpkg0001000000000000001',
    'classic',
    'Classic Micro Wedding',
    'Intimate ceremony for up to 20 guests with officiant and photographer',
    250000,
    true,
    NOW(),
    NOW()
  ),
  (
    'clzpkg0002000000000000002',
    'garden',
    'Garden Elopement',
    'Beautiful outdoor ceremony in our garden venue with floral arch',
    350000,
    true,
    NOW(),
    NOW()
  ),
  (
    'clzpkg0003000000000000003',
    'luxury',
    'Luxury Elopement',
    'Premium all-inclusive package with professional videography and reception',
    550000,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;

-- Insert Add-Ons
INSERT INTO "AddOn" (id, slug, name, description, price, active, "createdAt", "updatedAt")
VALUES
  (
    'clzadd0001000000000000001',
    'photography-2hr',
    'Photography (2 hrs)',
    'Professional photographer for 2 hours',
    60000,
    true,
    NOW(),
    NOW()
  ),
  (
    'clzadd0002000000000000002',
    'officiant',
    'Licensed Officiant',
    'Licensed wedding officiant for ceremony',
    30000,
    true,
    NOW(),
    NOW()
  ),
  (
    'clzadd0003000000000000003',
    'bouquet',
    'Bouquet & Boutonniere',
    'Fresh flower arrangements for bride and groom',
    15000,
    true,
    NOW(),
    NOW()
  ),
  (
    'clzadd0004000000000000004',
    'violinist',
    'Ceremony Violinist',
    'Professional violinist for ceremony music',
    25000,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;

-- Link Add-Ons to Classic Package
INSERT INTO "PackageAddOn" ("packageId", "addOnId")
VALUES
  ('clzpkg0001000000000000001', 'clzadd0001000000000000001'),
  ('clzpkg0001000000000000001', 'clzadd0002000000000000002'),
  ('clzpkg0001000000000000001', 'clzadd0003000000000000003'),
  ('clzpkg0001000000000000001', 'clzadd0004000000000000004')
ON CONFLICT ("packageId", "addOnId") DO NOTHING;

-- Link Add-Ons to Garden Package
INSERT INTO "PackageAddOn" ("packageId", "addOnId")
VALUES
  ('clzpkg0002000000000000002', 'clzadd0001000000000000001'),
  ('clzpkg0002000000000000002', 'clzadd0002000000000000002'),
  ('clzpkg0002000000000000002', 'clzadd0003000000000000003'),
  ('clzpkg0002000000000000002', 'clzadd0004000000000000004')
ON CONFLICT ("packageId", "addOnId") DO NOTHING;

-- Insert Blackout Date (Christmas 2025)
INSERT INTO "BlackoutDate" (id, date, reason, "createdAt")
VALUES (
  'clzblk0001000000000000001',
  '2025-12-25 00:00:00'::timestamp,
  'Holiday',
  NOW()
)
ON CONFLICT (date) DO NOTHING;

-- Verification Query
SELECT 'Seed complete!' as status,
  (SELECT COUNT(*) FROM "User") as users,
  (SELECT COUNT(*) FROM "Package") as packages,
  (SELECT COUNT(*) FROM "AddOn") as addons,
  (SELECT COUNT(*) FROM "PackageAddOn") as package_addons,
  (SELECT COUNT(*) FROM "BlackoutDate") as blackouts;
