import { CheckCircle } from "lucide-react";

interface SuccessMessageProps {
  message: string;
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  return (
    <div className="flex items-center gap-2 p-4 border border-lavender-600 bg-navy-700 rounded-lg">
      <CheckCircle className="w-5 h-5 text-lavender-300" />
      <span className="text-lg font-medium text-lavender-100">{message}</span>
    </div>
  );
}
