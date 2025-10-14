/**
 * Shared frontend types
 */

/**
 * Data stored in localStorage for the last checkout session
 */
export interface LastCheckout {
  packageId: string;
  eventDate: string;
  email: string;
  coupleName: string;
  addOnIds: string[];
}
