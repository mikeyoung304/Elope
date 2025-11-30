/**
 * Platform seed - Creates platform admin user only
 *
 * Use for: Production, staging
 * Requires: ADMIN_EMAIL and ADMIN_DEFAULT_PASSWORD environment variables
 */

import { PrismaClient } from '../../src/generated/prisma';
import bcrypt from 'bcryptjs';

// OWASP 2023 recommendation for bcrypt rounds
const BCRYPT_ROUNDS = 12;

export async function seedPlatform(prisma: PrismaClient): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Platform Admin';

  if (!adminEmail) {
    throw new Error(
      'ADMIN_EMAIL environment variable is required for platform seed.\n' +
      'Set it to the platform admin email address.'
    );
  }

  if (!adminPassword) {
    throw new Error(
      'ADMIN_DEFAULT_PASSWORD environment variable is required for platform seed.\n' +
      'Generate a secure password: openssl rand -base64 32'
    );
  }

  if (adminPassword.length < 12) {
    throw new Error('ADMIN_DEFAULT_PASSWORD must be at least 12 characters');
  }

  const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: 'PLATFORM_ADMIN', name: adminName },
    create: {
      email: adminEmail,
      name: adminName,
      role: 'PLATFORM_ADMIN',
      passwordHash
    },
  });

  console.log(`✅ Platform admin created: ${admin.email}`);
}
