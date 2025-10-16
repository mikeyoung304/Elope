/**
 * Optimized catalog service - eliminates N+1 queries
 * P0/P1 Implementation: Uses Prisma include for eager loading
 */

import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

/**
 * Fetch all active packages with their add-ons in a single query
 * Uses Prisma's include to prevent N+1 problem
 */
export async function listPackagesWithAddOns() {
  return prisma.package.findMany({
    where: { active: true },
    include: {
      addOns: {
        include: {
          addOn: true,
        },
      },
    },
    orderBy: { basePrice: 'asc' },
  });
}

/**
 * Map Prisma package result to DTO format
 */
export function mapPackageDTO(p: any) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    basePrice: p.basePrice,
    addOns: p.addOns.map((pa: any) => ({
      id: pa.addOn.id,
      slug: pa.addOn.slug,
      name: pa.addOn.name,
      price: pa.addOn.price,
    })),
  };
}
