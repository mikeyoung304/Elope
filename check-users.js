const { PrismaClient } = require('./server/src/generated/prisma');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('\n=== USERS ===');
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    console.table(users);

    console.log('\n=== TENANTS ===');
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        businessName: true,
        publicKey: true,
        isActive: true,
        createdAt: true,
      },
    });
    console.table(tenants);

    console.log('\n=== TENANT ADMINS (TenantAuth) ===');
    const tenantAdmins = await prisma.tenantAuth.findMany({
      include: {
        tenant: {
          select: {
            businessName: true,
            slug: true,
          },
        },
      },
    });
    console.table(tenantAdmins.map(ta => ({
      id: ta.id,
      email: ta.email,
      tenantSlug: ta.tenant.slug,
      businessName: ta.tenant.businessName,
      createdAt: ta.createdAt,
    })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
