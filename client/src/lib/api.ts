/**
 * ts-rest API client
 * Bound to @elope/contracts for type-safe API calls
 */

import { initClient } from "@ts-rest/core";
import { Contracts } from "@elope/contracts";

/**
 * Normalized API base URL
 *
 * Removes trailing slashes for consistent URL construction.
 * Defaults to localhost:3001 for local development.
 *
 * @example
 * ```typescript
 * console.log(baseUrl); // "http://localhost:3001"
 * ```
 */
// Normalize base URL (remove trailing slashes)
const raw = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
export const baseUrl = raw.replace(/\/+$/, "");

/**
 * Global tenant API key for multi-tenant widget mode
 * Set via api.setTenantKey() when widget loads
 */
let tenantApiKey: string | null = null;

/**
 * Global tenant JWT token for tenant admin dashboard
 * Set via api.setTenantToken() when tenant logs in
 */
let tenantToken: string | null = null;

/**
 * Type-safe API client for Elope wedding booking platform
 *
 * Provides end-to-end type safety between client and server via ts-rest contracts.
 * Automatically injects admin JWT tokens for protected routes.
 * Supports multi-tenant mode via X-Tenant-Key header.
 *
 * Features:
 * - Auto-generated TypeScript types from server contracts
 * - Admin authentication via localStorage token
 * - Multi-tenant support via tenant API key
 * - JSON content-type headers
 * - Error-safe JSON parsing with fallback to null
 *
 * @example
 * ```typescript
 * // Public route - no auth required
 * const { status, body } = await api.catalog.getPackages();
 * if (status === 200) {
 *   console.log(body); // Type-safe PackageWithAddOns[]
 * }
 *
 * // Protected route - JWT from localStorage
 * const { status, body } = await api.admin.getBookings();
 * // Automatically includes "Authorization: Bearer <token>" header
 *
 * // Multi-tenant mode - set tenant key once
 * api.setTenantKey('pk_live_xxx');
 * // All subsequent requests include "X-Tenant-Key" header
 * ```
 */
export const api = initClient(Contracts, {
  baseUrl,
  baseHeaders: {},
  api: async ({ path, method, headers, body }) => {
    // Build headers dynamically
    const authHeaders: Record<string, string> = { ...headers };

    // Inject auth token for admin routes
    if (path.startsWith("/v1/admin")) {
      const token = localStorage.getItem("adminToken");
      if (token) {
        authHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    // Inject auth token for tenant routes
    if (path.startsWith("/v1/tenant")) {
      const token = tenantToken || localStorage.getItem("tenantToken");
      if (token) {
        authHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    // Inject tenant key for multi-tenant mode (widget)
    if (tenantApiKey) {
      authHeaders["X-Tenant-Key"] = tenantApiKey;
    }

    // ts-rest provides the full URL in 'path', so use it directly
    const response = await fetch(path, {
      method,
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return {
      status: response.status,
      body: await response.json().catch(() => null),
      headers: response.headers,
    };
  },
});

/**
 * Set tenant API key for multi-tenant widget mode
 * Call this once when the widget loads with tenant-specific key
 */
(api as any).setTenantKey = (key: string | null) => {
  tenantApiKey = key;
};

/**
 * Set tenant JWT token for tenant admin dashboard
 * Call this when tenant logs in
 */
(api as any).setTenantToken = (token: string | null) => {
  tenantToken = token;
  if (token) {
    localStorage.setItem("tenantToken", token);
  } else {
    localStorage.removeItem("tenantToken");
  }
};

/**
 * Logout tenant admin (clear tenant token)
 */
(api as any).logoutTenant = () => {
  tenantToken = null;
  localStorage.removeItem("tenantToken");
};
