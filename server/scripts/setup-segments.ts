/**
 * Setup Segments for Little Bit Farm
 *
 * Creates 3 customer segments and assigns existing packages to them.
 * Also fixes the Barn Ceremony price bug (1500000 -> 150000 cents = $1,500).
 *
 * Run with: npx tsx scripts/setup-segments.ts
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const TENANT_SLUG = 'little-bit-farm';

// Segment definitions with stock wedding/farm images from Unsplash
const SEGMENTS = [
  {
    slug: 'elopements',
    name: 'Elopements',
    heroTitle: 'Just the Two of You',
    heroSubtitle: 'Intimate ceremonies in our most beautiful settings',
    heroImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80',
    description: 'Perfect for couples who want to focus on each other. Our elopement packages include a private ceremony spot, an officiant, and professional photography to capture your special moment.',
    metaTitle: 'Elopement Packages | Little Bit Farm',
    metaDescription: 'Intimate elopement ceremonies at Little Bit Farm. Just the two of you in a beautiful rustic setting.',
    sortOrder: 0,
  },
  {
    slug: 'intimate-weddings',
    name: 'Intimate Weddings',
    heroTitle: 'Share It With Those Who Matter Most',
    heroSubtitle: 'Small gatherings of up to 30 guests',
    heroImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&q=80',
    description: 'Invite your closest family and friends to witness your union. Our intimate wedding packages include ceremony and reception space, catering options, and all the details to make your day perfect.',
    metaTitle: 'Intimate Wedding Packages | Little Bit Farm',
    metaDescription: 'Intimate weddings for up to 30 guests at Little Bit Farm. Beautiful rustic venue with full service.',
    sortOrder: 1,
  },
  {
    slug: 'full-celebrations',
    name: 'Full Celebrations',
    heroTitle: 'A Day to Remember',
    heroSubtitle: 'Grand celebrations for up to 100 guests',
    heroImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=80',
    description: 'Go all out with a full celebration. Our comprehensive packages include our stunning barn venue, full catering, bar service, entertainment coordination, and a dedicated wedding planner.',
    metaTitle: 'Full Wedding Celebrations | Little Bit Farm',
    metaDescription: 'Full wedding celebrations for up to 100 guests at Little Bit Farm. Complete venue and service packages.',
    sortOrder: 2,
  },
];

// Map existing packages to segments
const PACKAGE_SEGMENT_MAP: Record<string, string> = {
  'garden-gathering': 'intimate-weddings',
  'farmhouse-reception': 'full-celebrations',
  'barn-ceremony': 'elopements',
};

async function main() {
  console.log('🚀 Setting up segments for Little Bit Farm');
  console.log('='.repeat(60));

  try {
    // Find the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_SLUG },
    });

    if (!tenant) {
      throw new Error(`Tenant "${TENANT_SLUG}" not found. Run create-real-tenants.ts first.`);
    }

    console.log(`\n✅ Found tenant: ${tenant.name} (${tenant.id})`);

    // Step 1: Create segments
    console.log('\n📝 Creating segments...');

    for (const segmentData of SEGMENTS) {
      const segment = await prisma.segment.upsert({
        where: {
          tenantId_slug: {
            tenantId: tenant.id,
            slug: segmentData.slug,
          },
        },
        update: {
          name: segmentData.name,
          heroTitle: segmentData.heroTitle,
          heroSubtitle: segmentData.heroSubtitle,
          heroImage: segmentData.heroImage,
          description: segmentData.description,
          metaTitle: segmentData.metaTitle,
          metaDescription: segmentData.metaDescription,
          sortOrder: segmentData.sortOrder,
          active: true,
        },
        create: {
          tenantId: tenant.id,
          slug: segmentData.slug,
          name: segmentData.name,
          heroTitle: segmentData.heroTitle,
          heroSubtitle: segmentData.heroSubtitle,
          heroImage: segmentData.heroImage,
          description: segmentData.description,
          metaTitle: segmentData.metaTitle,
          metaDescription: segmentData.metaDescription,
          sortOrder: segmentData.sortOrder,
          active: true,
        },
      });
      console.log(`   ✅ ${segment.name} (${segment.slug})`);
    }

    // Step 2: Fix Barn Ceremony price
    console.log('\n💰 Fixing Barn Ceremony price...');

    const barnPackage = await prisma.package.findFirst({
      where: {
        tenantId: tenant.id,
        slug: 'barn-ceremony',
      },
    });

    if (barnPackage) {
      // Price stored as 150000000 cents = $1,500,000 (bug)
      // Should be 150000 cents = $1,500
      if (barnPackage.basePrice > 10000000) {
        await prisma.package.update({
          where: { id: barnPackage.id },
          data: { basePrice: 150000 }, // $1,500 in cents
        });
        console.log(`   ✅ Fixed: $${barnPackage.basePrice / 100} → $1,500`);
      } else {
        console.log(`   ℹ️  Price already correct: $${barnPackage.basePrice / 100}`);
      }
    } else {
      console.log('   ⚠️  Barn Ceremony package not found');
    }

    // Step 3: Assign packages to segments
    console.log('\n🔗 Assigning packages to segments...');

    const segments = await prisma.segment.findMany({
      where: { tenantId: tenant.id },
    });

    const segmentMap = new Map(segments.map(s => [s.slug, s.id]));

    for (const [packageSlug, segmentSlug] of Object.entries(PACKAGE_SEGMENT_MAP)) {
      const segmentId = segmentMap.get(segmentSlug);
      if (!segmentId) {
        console.log(`   ⚠️  Segment "${segmentSlug}" not found`);
        continue;
      }

      const pkg = await prisma.package.findFirst({
        where: {
          tenantId: tenant.id,
          slug: packageSlug,
        },
      });

      if (!pkg) {
        console.log(`   ⚠️  Package "${packageSlug}" not found`);
        continue;
      }

      await prisma.package.update({
        where: { id: pkg.id },
        data: { segmentId },
      });
      console.log(`   ✅ ${pkg.name} → ${segmentSlug}`);
    }

    // Step 4: Add stock photos to packages if missing
    console.log('\n📸 Adding stock photos to packages...');

    const packagePhotos: Record<string, string> = {
      'garden-gathering': 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
      'farmhouse-reception': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
      'barn-ceremony': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    };

    for (const [packageSlug, photoUrl] of Object.entries(packagePhotos)) {
      const pkg = await prisma.package.findFirst({
        where: {
          tenantId: tenant.id,
          slug: packageSlug,
        },
      });

      if (!pkg) continue;

      // Check if photos already exist
      const existingPhotos = pkg.photos ? JSON.parse(pkg.photos as string) : [];
      if (existingPhotos.length === 0) {
        const photos = JSON.stringify([{
          url: photoUrl,
          filename: `${packageSlug}.jpg`,
          size: 0,
          order: 0,
        }]);

        await prisma.package.update({
          where: { id: pkg.id },
          data: { photos },
        });
        console.log(`   ✅ Added photo to ${pkg.name}`);
      } else {
        console.log(`   ℹ️  ${pkg.name} already has photos`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SETUP COMPLETE');
    console.log('='.repeat(60));

    const finalSegments = await prisma.segment.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        packages: {
          select: { name: true, slug: true },
        },
      },
    });

    console.log('\n📋 Final Configuration:\n');
    for (const segment of finalSegments) {
      console.log(`${segment.name} (${segment.slug})`);
      console.log(`   Hero: ${segment.heroTitle}`);
      console.log(`   Packages: ${segment.packages.map(p => p.name).join(', ') || 'None'}`);
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
