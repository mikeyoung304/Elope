/**
 * Storefront Feature Module
 *
 * Customer-facing storefront components for the 3-tier pricing model.
 *
 * Components:
 * - TierCard: Individual tier card with photo, name, price
 * - TierSelector: 3-tier card grid layout
 * - TierDetail: Full detail view with prev/next navigation
 *
 * Utilities:
 * - TIER_LEVELS: Standard tier level constants
 * - getTierDisplayName: Convert tier level to display name
 * - extractTiers: Extract tiers from package list
 */

export { TierCard } from './TierCard';
export { TierSelector } from './TierSelector';
export { TierDetail } from './TierDetail';

// Export shared utilities
export {
  TIER_LEVELS,
  getTierDisplayName,
  extractTiers,
  truncateText,
  CARD_DESCRIPTION_MAX_LENGTH,
  type TierLevel,
} from './utils';
