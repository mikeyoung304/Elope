/**
 * API client wrapper
 * Simple fetch-based client for calling backend endpoints
 */

import type { PackageDto } from "@elope/contracts";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getPackages: () => fetchJson<PackageDto[]>("/v1/packages"),
  getPackageBySlug: (slug: string) =>
    fetchJson<PackageDto>(`/v1/packages/${slug}`),
};
