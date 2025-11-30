import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "danger" | "neutral";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-sage/10 text-sage",
  warning: "bg-warning-100 text-warning-700",
  danger: "bg-danger-50 text-danger-600",
  neutral: "bg-text-muted/10 text-text-muted",
};

/**
 * Auto-detect variant from common status strings
 */
function getVariantFromStatus(status: string): StatusVariant {
  const lower = status.toLowerCase();
  if (["active", "confirmed", "paid", "success", "connected"].includes(lower)) return "success";
  if (["pending", "warning"].includes(lower)) return "warning";
  if (["inactive", "cancelled", "canceled", "refunded", "error"].includes(lower)) return "danger";
  return "neutral";
}

/**
 * StatusBadge Component
 *
 * A shared status badge component that provides consistent styling
 * for status indicators across the application.
 *
 * Design: Matches landing page aesthetic with sage accents
 *
 * Features:
 * - Auto-detects variant from common status strings
 * - Supports custom variant override
 * - Capitalizes status text automatically
 * - Consistent pill-shaped design with color-coded backgrounds
 *
 * Usage:
 * ```tsx
 * <StatusBadge status="active" />
 * <StatusBadge status="pending" />
 * <StatusBadge status="cancelled" />
 * <StatusBadge status="custom" variant="success" />
 * ```
 */
export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const resolvedVariant = variant || getVariantFromStatus(status);
  const displayText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full",
        variantStyles[resolvedVariant],
        className
      )}
    >
      {displayText}
    </span>
  );
}
