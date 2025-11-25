import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';
import { apiKeyService } from '../src/lib/api-key.service';

const prisma = new PrismaClient();

// OWASP 2023 recommendation for bcrypt rounds
const BCRYPT_ROUNDS = 12;

async function main() {
  // Create admin user
  // Require strong admin password from environment
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!adminPassword) {
    console.warn('⚠️  ADMIN_DEFAULT_PASSWORD not set, using insecure default "admin"');
    console.warn('⚠️  Set ADMIN_DEFAULT_PASSWORD environment variable before production!');
  }
  if (adminPassword && adminPassword.length < 12) {
    throw new Error('ADMIN_DEFAULT_PASSWORD must be at least 12 characters');
  }

  const passwordHash = await bcrypt.hash('@Nupples8', BCRYPT_ROUNDS);
  await prisma.user.upsert({
    where: { email: 'mike@maconheadshots.com' },
    update: { passwordHash, role: 'PLATFORM_ADMIN' },
    create: { email: 'mike@maconheadshots.com', name: 'Mike Young', role: 'PLATFORM_ADMIN', passwordHash },
  });

  // Create test tenant for E2E tests with known API key
  // This tenant is used by the client app in E2E mode
  const testTenantSlug = 'mais-e2e';
  const testTenantApiKey = 'pk_live_mais-e2e_0000000000000000'; // Fixed key for E2E tests (16 hex chars)
  const testTenantSecretKey = 'sk_live_mais-e2e_00000000000000000000000000000000'; // 32 hex chars

  const tenant = await prisma.tenant.upsert({
    where: { slug: testTenantSlug },
    update: {
      apiKeyPublic: testTenantApiKey,
      // Update colors to Macon brand (rebuild-6.0)
      primaryColor: '#1a365d',
      secondaryColor: '#fb923c',
      accentColor: '#38b2ac',
      backgroundColor: '#ffffff',
    },
    create: {
      slug: testTenantSlug,
      name: 'MAIS E2E Test Tenant',
      commissionPercent: 5.0,
      apiKeyPublic: testTenantApiKey,
      apiKeySecret: apiKeyService.hashSecretKey(testTenantSecretKey),
      stripeAccountId: null,
      stripeOnboarded: false,
      isActive: true,
      // Macon brand colors (rebuild-6.0 design system)
      primaryColor: '#1a365d',    // Macon Navy
      secondaryColor: '#fb923c',  // Macon Orange
      accentColor: '#38b2ac',     // Macon Teal
      backgroundColor: '#ffffff', // White
      // Only non-color branding settings go in branding JSON
      branding: {
        fontFamily: 'Inter, system-ui, sans-serif',
      },
    },
  });

  console.log(`✅ Created test tenant: ${tenant.name} (${tenant.slug})`);
  console.log(`   API Key: ${testTenantApiKey}`);

  // Create packages for the test tenant
  const [classic, garden, luxury] = await Promise.all([
    prisma.package.upsert({
      where: { tenantId_slug: { slug: 'classic', tenantId: tenant.id } },
      update: {},
      create: {
        slug: 'classic',
        name: 'Classic Micro Wedding',
        description: 'An intimate ceremony with essential services for a memorable day.',
        basePrice: 250000,
        photos: JSON.stringify([{
          url: 'https://images.unsplash.com/photo-1519741497674-611481863552',
          filename: 'classic.jpg',
          size: 0,
          order: 0,
        }]),
        tenantId: tenant.id,
      },
    }),
    prisma.package.upsert({
      where: { tenantId_slug: { slug: 'garden', tenantId: tenant.id } },
      update: {},
      create: {
        slug: 'garden',
        name: 'Garden Elopement',
        description: 'A romantic outdoor ceremony in a beautiful garden setting.',
        basePrice: 350000,
        photos: JSON.stringify([{
          url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3',
          filename: 'garden.jpg',
          size: 0,
          order: 0,
        }]),
        tenantId: tenant.id,
      },
    }),
    prisma.package.upsert({
      where: { tenantId_slug: { slug: 'luxury', tenantId: tenant.id } },
      update: {},
      create: {
        slug: 'luxury',
        name: 'Luxury Elopement',
        description: 'Premium experience with exclusive venue and top-tier services.',
        basePrice: 550000,
        photos: JSON.stringify([{
          url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
          filename: 'luxury.jpg',
          size: 0,
          order: 0,
        }]),
        tenantId: tenant.id,
      },
    }),
  ]);

  // Create add-ons for packages
  const photography = await prisma.addOn.create({
    data: {
      tenantId: tenant.id,
      slug: 'photography-2hr',
      name: 'Photography (2 hrs)',
      description: 'Professional photography service for 2 hours',
      price: 60000,
    },
  });

  const officiant = await prisma.addOn.create({
    data: {
      tenantId: tenant.id,
      slug: 'officiant',
      name: 'Licensed Officiant',
      description: 'Certified officiant for your ceremony',
      price: 30000,
    },
  });

  const bouquet = await prisma.addOn.create({
    data: {
      tenantId: tenant.id,
      slug: 'bouquet',
      name: 'Bouquet & Boutonniere',
      description: 'Beautiful floral arrangements',
      price: 15000,
    },
  });

  const violinist = await prisma.addOn.create({
    data: {
      tenantId: tenant.id,
      slug: 'violinist',
      name: 'Ceremony Violinist',
      description: 'Live violin music for your ceremony',
      price: 25000,
    },
  });

  // Link add-ons to packages using the junction table
  await Promise.all([
    prisma.packageAddOn.create({
      data: { packageId: classic.id, addOnId: photography.id },
    }),
    prisma.packageAddOn.create({
      data: { packageId: classic.id, addOnId: officiant.id },
    }),
    prisma.packageAddOn.create({
      data: { packageId: garden.id, addOnId: bouquet.id },
    }),
    prisma.packageAddOn.create({
      data: { packageId: garden.id, addOnId: photography.id },
    }),
    prisma.packageAddOn.create({
      data: { packageId: luxury.id, addOnId: violinist.id },
    }),
    prisma.packageAddOn.create({
      data: { packageId: luxury.id, addOnId: photography.id },
    }),
  ]);

  console.log(`✅ Created ${[classic, garden, luxury].length} packages with add-ons`);

  // Create blackout date for the test tenant
  await prisma.blackoutDate.upsert({
    where: {
      tenantId_date: {
        date: new Date('2025-12-25T00:00:00Z'),
        tenantId: tenant.id,
      }
    },
    update: {},
    create: {
      date: new Date('2025-12-25T00:00:00Z'),
      reason: 'Holiday',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Database seeded successfully!');
}

main().finally(() => prisma.$disconnect());
