/**
 * Tenant HTTP controller
 * Handles public tenant-specific endpoints (branding configuration)
 */

import type { TenantBrandingDto } from '@elope/contracts';
import type { PrismaTenantRepository } from '../adapters/prisma/tenant.repository';

export class TenantController {
  constructor(private readonly tenantRepository: PrismaTenantRepository) {}

  /**
   * Get tenant branding configuration
   * Returns branding settings for widget customization
   *
   * @param tenantId - Tenant ID from middleware
   * @returns Branding configuration object
   */
  async getBranding(tenantId: string): Promise<TenantBrandingDto> {
    const tenant = await this.tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Parse branding JSON and ensure it matches the DTO schema
    const branding = tenant.branding as any || {};

    return {
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      fontFamily: branding.fontFamily,
      logo: branding.logo,
    };
  }
}
