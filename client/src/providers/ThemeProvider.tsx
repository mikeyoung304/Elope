/**
 * Theme Provider
 * Provides consistent Macon AI Solutions branding
 * Fixed brand colors (no dynamic tenant theming)
 */

import type { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider wraps the app with Macon AI Solutions fixed branding
 *
 * Macon AI Solutions brand colors:
 * - Primary: #1a365d (navy)
 * - Secondary: #fb923c (orange)
 * - Accent: #38b2ac (teal)
 * - Background: #ffffff (white)
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}
