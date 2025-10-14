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
});
