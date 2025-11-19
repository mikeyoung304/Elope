import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {/* Icon with subtle background */}
      <div className="mb-4 rounded-full bg-macon-navy-50 p-6 dark:bg-macon-navy-900/20">
        <Icon className="h-12 w-12 text-macon-navy-400 dark:text-macon-navy-500" />
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-macon-navy-900 dark:text-macon-navy-100">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-6 max-w-sm text-sm text-macon-navy-600 dark:text-macon-navy-400">
        {description}
      </p>

      {/* Optional CTA */}
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}
