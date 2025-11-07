/**
 * Express type extensions for tenant authentication
 */

import type { TenantTokenPayload } from '../lib/ports';

declare global {
  namespace Express {
    interface Locals {
      tenantAuth?: TenantTokenPayload;
      logger?: any;
    }
  }
}
