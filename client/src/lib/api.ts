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
 * Type-safe API client for Elope wedding booking platform
 *
 * Provides end-to-end type safety between client and server via ts-rest contracts.
 * Automatically injects admin JWT tokens for protected routes.
 *
 * Features:
 * - Auto-generated TypeScript types from server contracts
 * - Admin authentication via localStorage token
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
 * ```
 */
export const api = initClient(Contracts, {
  baseUrl,
  baseHeaders: {},
  api: async ({ path, method, headers, body }) => {
    // Inject auth token for admin routes
    const authHeaders: Record<string, string> = { ...headers };
    if (path.startsWith("/v1/admin")) {
      const token = localStorage.getItem("adminToken");
      if (token) {
        authHeaders["Authorization"] = `Bearer ${token}`;
      }
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
