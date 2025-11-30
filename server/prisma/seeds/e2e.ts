/**
 * E2E Test seed - Creates test tenant with fixed, predictable API keys
 *
 * Use for: E2E tests, CI/CD pipelines
 * WARNING: Never use these keys in production - they are public knowledge
 */

import { PrismaClient } from '../../src/generated/prisma';
import { apiKeyService } from '../../src/lib/api-key.service';
import { logger } from '../../src/lib/core/logger';

// Fixed keys for E2E tests - NEVER use in production
// These are intentionally predictable for test automation
const E2E_TENANT_SLUG = 'mais-e2e';
const E2E_PUBLIC_KEY = 'pk_live_mais-e2e_0000000000000000'; // 16 hex chars
const E2E_SECRET_KEY = 'sk_live_mais-e2e_00000000000000000000000000000000'; // 32 hex chars

export async function seedE2E(prisma: PrismaClient): Promise<void> {
  // CRITICAL: Block E2E seed in production
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: E2E seed cannot run in production environment!\n' +
      'E2E seeds contain fixed test keys that are publicly visible in source code.\n' +
      'Use SEED_MODE=production for production environments.'
    );
  }

  // Create test tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: E2E_TENANT_SLUG },
    update: {
      apiKeyPublic: E2E_PUBLIC_KEY,
      primaryColor: '#1a365d',
      secondaryColor: '#fb923c',
      accentColor: '#38b2ac',
      backgroundColor: '#ffffff',
    },
    create: {
      slug: E2E_TENANT_SLUG,
      name: 'MAIS E2E Test Tenant',
      commissionPercent: 5.0,
      apiKeyPublic: E2E_PUBLIC_KEY,
      apiKeySecret: apiKeyService.hashSecretKey(E2E_SECRET_KEY),
      stripeAccountId: null,
      stripeOnboarded: false,
      isActive: true,
      primaryColor: '#1a365d',
      secondaryColor: '#fb923c',
      accentColor: '#38b2ac',
      backgroundColor: '#ffffff',
      branding: { fontFamily: 'Inter, system-ui, sans-serif' },
    },
  });

  logger.info(`E2E test tenant created: ${tenant.name} (${tenant.slug})`);
  logger.info(`Public Key: ${E2E_PUBLIC_KEY}`);

  // Create minimal packages for E2E tests
  const [starter, growth] = await Promise.all([
    prisma.package.upsert({
      where: { tenantId_slug: { slug: 'starter', tenantId: tenant.id } },
      update: {},
      create: {
        slug: 'starter',
        name: 'Starter Package',
        description: 'Basic package for E2E testing',
        basePrice: 25000,
        photos: JSON.stringify([]),
        tenantId: tenant.id,
      },
    }),
    prisma.package.upsert({
      where: { tenantId_slug: { slug: 'growth', tenantId: tenant.id } },
      update: {},
      create: {
        slug: 'growth',
        name: 'Growth Package',
        description: 'Growth package for E2E testing',
        basePrice: 50000,
        photos: JSON.stringify([]),
        tenantId: tenant.id,
      },
    }),
  ]);

  logger.info(`E2E packages created: ${[starter, growth].length}`);

  // Create one add-on for testing
  const addOn = await prisma.addOn.upsert({
    where: { tenantId_slug: { slug: 'test-addon', tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      slug: 'test-addon',
      name: 'Test Add-On',
      description: 'Add-on for E2E testing',
      price: 5000,
    },
  });

  // Link add-on to starter package
  await prisma.packageAddOn.upsert({
    where: { packageId_addOnId: { packageId: starter.id, addOnId: addOn.id } },
    update: {},
    create: { packageId: starter.id, addOnId: addOn.id },
  });

  logger.info('E2E add-on linked to starter package');
}

// Export keys for test files to import
export const E2E_KEYS = {
  tenantSlug: E2E_TENANT_SLUG,
  publicKey: E2E_PUBLIC_KEY,
  secretKey: E2E_SECRET_KEY,
} as const;
