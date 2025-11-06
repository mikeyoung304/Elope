import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

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

  const passwordHash = await bcrypt.hash(adminPassword || 'admin', BCRYPT_ROUNDS);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', name: 'Admin', role: 'ADMIN', passwordHash },
  });

  // Create packages
  const [classic, garden, luxury] = await Promise.all([
    prisma.package.upsert({
      where: { slug: 'classic' },
      update: {},
      create: { slug: 'classic', name: 'Classic Micro Wedding', basePrice: 250000 },
    }),
    prisma.package.upsert({
      where: { slug: 'garden' },
      update: {},
      create: { slug: 'garden', name: 'Garden Elopement', basePrice: 350000 },
    }),
    prisma.package.upsert({
      where: { slug: 'luxury' },
      update: {},
      create: { slug: 'luxury', name: 'Luxury Elopement', basePrice: 550000 },
    }),
  ]);

  // Create add-ons
  const addons = await Promise.all([
    prisma.addOn.upsert({
      where: { slug: 'photography-2hr' },
      update: {},
      create: { slug: 'photography-2hr', name: 'Photography (2 hrs)', price: 60000 },
    }),
    prisma.addOn.upsert({
      where: { slug: 'officiant' },
      update: {},
      create: { slug: 'officiant', name: 'Licensed Officiant', price: 30000 },
    }),
    prisma.addOn.upsert({
      where: { slug: 'bouquet' },
      update: {},
      create: { slug: 'bouquet', name: 'Bouquet & Boutonniere', price: 15000 },
    }),
    prisma.addOn.upsert({
      where: { slug: 'violinist' },
      update: {},
      create: { slug: 'violinist', name: 'Ceremony Violinist', price: 25000 },
    }),
  ]);

  // Link add-ons to packages
  for (const a of addons) {
    await prisma.packageAddOn.upsert({
      where: { packageId_addOnId: { packageId: classic.id, addOnId: a.id } },
      update: {},
      create: { packageId: classic.id, addOnId: a.id },
    });
    await prisma.packageAddOn.upsert({
      where: { packageId_addOnId: { packageId: garden.id, addOnId: a.id } },
      update: {},
      create: { packageId: garden.id, addOnId: a.id },
    });
  }

  // Create blackout date
  await prisma.blackoutDate.upsert({
    where: { date: new Date('2025-12-25T00:00:00Z') },
    update: {},
    create: { date: new Date('2025-12-25T00:00:00Z'), reason: 'Holiday' },
  });
}

main().finally(() => prisma.$disconnect());
