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
 * - Secondary: #d97706 (orange) - WCAG AA compliant
 * - Accent: #0d9488 (teal) - WCAG AA compliant
 * - Background: #ffffff (white)
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}
