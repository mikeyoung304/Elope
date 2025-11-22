import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  className?: string;
}

/**
 * Error alert component with warning icon
 * Used across admin and tenant-admin features for displaying error messages
 */
export function ErrorAlert({ message, className = "" }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={`flex items-center gap-2 p-4 border border-macon-navy-600 bg-macon-navy-700 rounded-lg ${className}`}
    >
      <AlertCircle className="w-5 h-5 text-macon-navy-200" />
      <span className="text-base text-macon-navy-100">{message}</span>
    </div>
  );
}
