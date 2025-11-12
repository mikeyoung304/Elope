/**
 * Script to update admin user email to admin@elope.com
 */
import { PrismaClient } from './src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const passwordHash = await bcrypt.hash('admin123', 12);

  // Update or create admin user
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      email: 'admin@elope.com',
      passwordHash,
    },
    create: {
      email: 'admin@elope.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user updated:', user);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
