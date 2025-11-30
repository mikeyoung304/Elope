/**
 * Prisma repository for Tenant data access
 * Provides data layer for multi-tenant operations
 */

import { PrismaClient, Tenant } from '../../generated/prisma';
import { TenantPublicDtoSchema, ALLOWED_FONT_FAMILIES } from '@macon/contracts';
import type { TenantPublicDto } from '@macon/contracts';

export interface CreateTenantInput {
  slug: string;
  name: string;
  apiKeyPublic: string;
  apiKeySecret: string;
  commissionPercent: number;
  branding?: any;
  // Optional fields for self-service signup
  email?: string;
  passwordHash?: string;
  emailVerified?: boolean;
}

export interface UpdateTenantInput {
  name?: string;
  commissionPercent?: number;
  branding?: any;
  stripeAccountId?: string;
  stripeOnboarded?: boolean;
  secrets?: any;
  isActive?: boolean;
  // Password reset fields
  email?: string;
  passwordHash?: string;
  emailVerified?: boolean;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
}

/**
 * Tenant repository for CRUD operations
 * Handles multi-tenant isolation and API key lookups
 */
export class PrismaTenantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find tenant by public API key
   * Used for API authentication and tenant identification
   *
   * @param apiKey - Public API key (pk_live_*)
   * @returns Tenant or null if not found
   */
  async findByApiKey(apiKey: string): Promise<Tenant | null> {
    return await this.prisma.tenant.findUnique({
      where: { apiKeyPublic: apiKey },
    });
  }

  /**
   * Find tenant by ID
   *
   * @param id - Tenant ID (CUID)
   * @returns Tenant or null if not found
   */
  async findById(id: string): Promise<Tenant | null> {
    return await this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  /**
   * Find tenant by slug
   *
   * @param slug - URL-safe tenant identifier
   * @returns Tenant or null if not found
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return await this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  /**
   * Find tenant by email
   * Used for tenant admin authentication
   *
   * @param email - Tenant admin email
   * @returns Tenant or null if not found
   */
  async findByEmail(email: string): Promise<Tenant | null> {
    // Normalize email to lowercase for case-insensitive lookup
    return await this.prisma.tenant.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Find tenant by password reset token
   * Used for password reset flow
   *
   * @param token - Password reset token
   * @returns Tenant or null if not found
   */
  async findByResetToken(token: string): Promise<Tenant | null> {
    return await this.prisma.tenant.findUnique({
      where: { passwordResetToken: token },
    });
  }

  /**
   * Create new tenant
   *
   * @param data - Tenant creation data
   * @returns Created tenant
   */
  async create(data: CreateTenantInput): Promise<Tenant> {
    return await this.prisma.tenant.create({
      data: {
        slug: data.slug,
        name: data.name,
        apiKeyPublic: data.apiKeyPublic,
        apiKeySecret: data.apiKeySecret,
        commissionPercent: data.commissionPercent,
        branding: data.branding || {},
        // Self-service signup fields
        // Normalize email to lowercase for case-insensitive uniqueness
        email: data.email?.toLowerCase(),
        passwordHash: data.passwordHash,
        emailVerified: data.emailVerified ?? false,
      },
    });
  }

  /**
   * Update tenant by ID
   *
   * @param id - Tenant ID
   * @param data - Partial tenant update data
   * @returns Updated tenant
   */
  async update(id: string, data: UpdateTenantInput): Promise<Tenant> {
    return await this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  /**
   * List all tenants with optional filtering
   *
   * @param onlyActive - Filter to only active tenants
   * @returns Array of tenants
   */
  async list(onlyActive = false): Promise<Tenant[]> {
    return await this.prisma.tenant.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Deactivate tenant (soft delete)
   *
   * @param id - Tenant ID
   * @returns Updated tenant
   */
  async deactivate(id: string): Promise<Tenant> {
    return await this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get tenant statistics (booking count, package count)
   *
   * @param id - Tenant ID
   * @returns Object with counts
   */
  async getStats(id: string): Promise<{
    bookingCount: number;
    packageCount: number;
    addOnCount: number;
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            packages: true,
            addOns: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${id}`);
    }

    return {
      bookingCount: tenant._count.bookings,
      packageCount: tenant._count.packages,
      addOnCount: tenant._count.addOns,
    };
  }

  /**
   * Find active tenant by slug with public fields only
   * Used for public storefront routing - returns only safe fields
   *
   * SECURITY: Only returns allowlisted fields:
   * - id, slug, name - Public identifiers
   * - apiKeyPublic - Read-only API key for X-Tenant-Key header
   * - branding - Visual customization (validated)
   *
   * @param slug - URL-safe tenant identifier
   * @returns TenantPublicDto or null if not found/inactive
   */
  async findBySlugPublic(slug: string): Promise<TenantPublicDto | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        apiKeyPublic: true,
        branding: true,
      },
    });

    if (!tenant) {
      return null;
    }

    // Safely extract and validate branding fields
    const rawBranding = tenant.branding as Record<string, unknown> | null;
    let validatedBranding: TenantPublicDto['branding'] = undefined;

    if (rawBranding) {
      // Validate each branding field before including it
      const safeBranding: TenantPublicDto['branding'] = {};

      // Validate colors (must be hex format #XXXXXX)
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (typeof rawBranding.primaryColor === 'string' && hexColorRegex.test(rawBranding.primaryColor)) {
        safeBranding.primaryColor = rawBranding.primaryColor;
      }
      if (typeof rawBranding.secondaryColor === 'string' && hexColorRegex.test(rawBranding.secondaryColor)) {
        safeBranding.secondaryColor = rawBranding.secondaryColor;
      }
      if (typeof rawBranding.accentColor === 'string' && hexColorRegex.test(rawBranding.accentColor)) {
        safeBranding.accentColor = rawBranding.accentColor;
      }
      if (typeof rawBranding.backgroundColor === 'string' && hexColorRegex.test(rawBranding.backgroundColor)) {
        safeBranding.backgroundColor = rawBranding.backgroundColor;
      }

      // Validate fontFamily (must be in allowlist)
      if (typeof rawBranding.fontFamily === 'string' &&
          (ALLOWED_FONT_FAMILIES as readonly string[]).includes(rawBranding.fontFamily)) {
        safeBranding.fontFamily = rawBranding.fontFamily as typeof ALLOWED_FONT_FAMILIES[number];
      }

      // Validate logoUrl (must be valid URL)
      // Note: Database stores 'logo', DTO expects 'logoUrl'
      const logoValue = rawBranding.logo ?? rawBranding.logoUrl;
      if (typeof logoValue === 'string') {
        try {
          new URL(logoValue); // Validate URL format
          safeBranding.logoUrl = logoValue;
        } catch {
          // Invalid URL, skip this field
        }
      }

      // Only include branding if we have at least one valid field
      if (Object.keys(safeBranding).length > 0) {
        validatedBranding = safeBranding;
      }
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      apiKeyPublic: tenant.apiKeyPublic,
      branding: validatedBranding,
    };
  }
}
