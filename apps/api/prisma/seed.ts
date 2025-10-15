/**
 * Database seeding script
 * Run with: pnpm exec prisma db seed
 */

import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'admin',
    },
  });
  console.log(`✓ Admin user created: ${admin.email}`);

  // Create wedding packages
  console.log('\nCreating wedding packages...');

  const intimatePackage = await prisma.package.upsert({
    where: { slug: 'intimate-ceremony' },
    update: {},
    create: {
      slug: 'intimate-ceremony',
      title: 'Intimate Ceremony',
      description:
        'Perfect for couples who want a simple, elegant ceremony. Includes officiant, basic photography, and ceremony coordination.',
      priceCents: 150000, // $1,500
      photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552',
    },
  });
  console.log(`✓ Package created: ${intimatePackage.title}`);

  const classicPackage = await prisma.package.upsert({
    where: { slug: 'classic-elopement' },
    update: {},
    create: {
      slug: 'classic-elopement',
      title: 'Classic Elopement',
      description:
        'Our most popular package! Includes professional photography, videography, flowers, and champagne toast.',
      priceCents: 350000, // $3,500
      photoUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff',
    },
  });
  console.log(`✓ Package created: ${classicPackage.title}`);

  const luxuryPackage = await prisma.package.upsert({
    where: { slug: 'luxury-experience' },
    update: {},
    create: {
      slug: 'luxury-experience',
      title: 'Luxury Experience',
      description:
        'The ultimate elopement experience with premium photography, videography, flowers, gourmet dinner for two, and spa treatments.',
      priceCents: 750000, // $7,500
      photoUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3',
    },
  });
  console.log(`✓ Package created: ${luxuryPackage.title}`);

  // Create add-ons for intimate package
  console.log('\nCreating add-ons...');

  await prisma.addOn.upsert({
    where: { id: 'addon-intimate-flowers' },
    update: {},
    create: {
      id: 'addon-intimate-flowers',
      packageId: intimatePackage.id,
      title: 'Bridal Bouquet',
      priceCents: 15000, // $150
      photoUrl: 'https://images.unsplash.com/photo-1522767840828-1b5c1f5e1d78',
    },
  });

  await prisma.addOn.upsert({
    where: { id: 'addon-intimate-video' },
    update: {},
    create: {
      id: 'addon-intimate-video',
      packageId: intimatePackage.id,
      title: 'Video Highlights',
      priceCents: 75000, // $750
      photoUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4',
    },
  });

  // Create add-ons for classic package
  await prisma.addOn.upsert({
    where: { id: 'addon-classic-makeup' },
    update: {},
    create: {
      id: 'addon-classic-makeup',
      packageId: classicPackage.id,
      title: 'Hair & Makeup',
      priceCents: 30000, // $300
      photoUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2',
    },
  });

  await prisma.addOn.upsert({
    where: { id: 'addon-classic-dinner' },
    update: {},
    create: {
      id: 'addon-classic-dinner',
      packageId: classicPackage.id,
      title: 'Private Dinner for Two',
      priceCents: 40000, // $400
      photoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
    },
  });

  // Create add-ons for luxury package
  await prisma.addOn.upsert({
    where: { id: 'addon-luxury-drone' },
    update: {},
    create: {
      id: 'addon-luxury-drone',
      packageId: luxuryPackage.id,
      title: 'Drone Videography',
      priceCents: 50000, // $500
      photoUrl: 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135',
    },
  });

  await prisma.addOn.upsert({
    where: { id: 'addon-luxury-limo' },
    update: {},
    create: {
      id: 'addon-luxury-limo',
      packageId: luxuryPackage.id,
      title: 'Luxury Transportation',
      priceCents: 60000, // $600
      photoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2',
    },
  });

  console.log('✓ All add-ons created');

  // Create some sample blackout dates
  console.log('\nCreating blackout dates...');

  const today = new Date();
  const futureDate1 = new Date(today);
  futureDate1.setDate(today.getDate() + 30);

  const futureDate2 = new Date(today);
  futureDate2.setDate(today.getDate() + 60);

  await prisma.blackoutDate.upsert({
    where: { date: futureDate1 },
    update: {},
    create: {
      date: futureDate1,
      reason: 'Private event',
    },
  });

  await prisma.blackoutDate.upsert({
    where: { date: futureDate2 },
    update: {},
    create: {
      date: futureDate2,
      reason: 'Venue maintenance',
    },
  });

  console.log('✓ Blackout dates created');

  console.log('\n✨ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • 1 admin user (admin@example.com / password: admin123)`);
  console.log(`   • 3 wedding packages`);
  console.log(`   • 6 add-ons`);
  console.log(`   • 2 blackout dates`);
  console.log('\n🚀 You can now start the API in real mode!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
