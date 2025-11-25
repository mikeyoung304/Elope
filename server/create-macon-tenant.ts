/**
 * Script to create 'macon' tenant with login credentials
 */

import { PrismaClient } from './src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function createMaconTenant() {
  const prisma = new PrismaClient();

  try {
    // Check if macon tenant already exists
    const existing = await prisma.tenant.findUnique({
      where: { slug: 'macon' },
    });

    if (existing) {
      console.log('✅ Tenant "macon" already exists with ID:', existing.id);
      console.log('   Email:', existing.email);
      return;
    }

    // Generate password hash
    const password = 'SecureMacon2025!'; // Strong default password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate API keys
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const apiKeyPublic = `pk_live_macon_${randomSuffix}`;

    const secretRandom = crypto.randomBytes(32).toString('hex');
    const apiKeySecret = await bcrypt.hash(secretRandom, 10); // Hash the secret

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        slug: 'macon',
        name: 'MAIS Demo Tenant',
        email: 'demo@maconaisolutions.com',
        passwordHash,
        apiKeyPublic,
        apiKeySecret,
        commissionPercent: 12.0, // 12% commission
        branding: {
          primaryColor: '#8B4513', // Saddle brown (Georgia warmth)
          secondaryColor: '#CD853F', // Peru (Southern charm)
          fontFamily: 'Georgia, serif', // Georgia font for Georgia city!
        },
        isActive: true,
        stripeOnboarded: false,
      },
    });

    console.log('✅ Successfully created "macon" tenant!');
    console.log('');
    console.log('📋 Tenant Details:');
    console.log('   ID:', tenant.id);
    console.log('   Slug:', tenant.slug);
    console.log('   Name:', tenant.name);
    console.log('   Email:', tenant.email);
    console.log('   Commission:', tenant.commissionPercent + '%');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('   Email: demo@maconaisolutions.com');
    console.log('   Password:', password);
    console.log('');
    console.log('🎨 Branding:');
    console.log('   Primary Color:', tenant.branding.primaryColor);
    console.log('   Secondary Color:', tenant.branding.secondaryColor);
    console.log('   Font:', tenant.branding.fontFamily);
    console.log('');
    console.log('🔐 API Keys:');
    console.log('   Public Key:', tenant.apiKeyPublic);
    console.log('');
    console.log('🌐 Storefront URL: http://localhost:5173/?tenant=macon');
    console.log('🎛️  Admin Dashboard: http://localhost:5173/login → use demo@maconaisolutions.com');
  } catch (error) {
    console.error('❌ Failed to create tenant:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createMaconTenant();
