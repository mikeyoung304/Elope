/**
 * ErrorMessage Component
 *
 * Displays form error messages
 */

import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  error: string | null;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-2 p-4 mb-4 border border-macon-navy-600 bg-macon-navy-700 rounded-lg"
    >
      <AlertCircle className="w-5 h-5 text-macon-navy-200" />
      <span className="text-base text-macon-navy-100">{error}</span>
    </div>
  );
}