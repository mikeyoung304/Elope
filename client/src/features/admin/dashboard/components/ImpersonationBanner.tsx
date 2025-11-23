import { AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface ImpersonationBannerProps {
  tenantName: string;
  tenantSlug: string;
  onStopImpersonation: () => void;
}

/**
 * Impersonation Banner Component
 *
 * Displayed when platform admin is impersonating a tenant.
 * Shows clear visual indication and provides button to exit impersonation.
 */
export function ImpersonationBanner({
  tenantName,
  tenantSlug,
  onStopImpersonation,
}: ImpersonationBannerProps) {
  const handleStopImpersonation = async () => {
    try {
      const result = await api.adminStopImpersonation();
      if (result.status === 200 && result.body) {
        // Token is automatically stored by api.adminStopImpersonation
        onStopImpersonation();
        // Reload to return to normal admin view
        window.location.reload();
      } else {
        console.error("Stop impersonation failed:", result.status);
        alert("Failed to stop impersonation. Please try again.");
      }
    } catch (error) {
      console.error("Stop impersonation error:", error);
      alert("An error occurred while stopping impersonation.");
    }
  };

  return (
    <div className="bg-yellow-900/50 border-2 border-yellow-500 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-400" />
          <div>
            <p className="text-yellow-100 font-semibold text-lg">
              Impersonating Tenant
            </p>
            <p className="text-yellow-200 text-sm">
              You are currently signed in as{" "}
              <span className="font-semibold">{tenantName}</span> ({tenantSlug})
            </p>
          </div>
        </div>

        <Button
          onClick={handleStopImpersonation}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
          size="lg"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Exit Impersonation
        </Button>
      </div>
    </div>
  );
}
