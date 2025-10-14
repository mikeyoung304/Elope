/**
 * ts-rest API client
 * Bound to @elope/contracts for type-safe API calls
 */

import { initClient } from "@ts-rest/core";
import { Contracts } from "@elope/contracts";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: authHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    return {
      status: response.status,
      body: await response.json().catch(() => null),
      headers: response.headers,
    };
  },
});
