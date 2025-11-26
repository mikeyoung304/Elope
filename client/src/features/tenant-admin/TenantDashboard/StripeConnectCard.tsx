/**
 * StripeConnectCard Component
 *
 * Displays Stripe Connect account status and handles onboarding flow
 * for tenant administrators to set up payment processing.
 */

import { useState, useEffect } from "react";
import { ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface StripeStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
}

export function StripeConnectCard() {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [onboarding, setOnboarding] = useState(false);

  // Fetch Stripe Connect status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.tenantAdminGetStripeStatus();

      if (result.status === 200 && result.body) {
        setStatus(result.body);
      } else if (result.status === 404) {
        // No account exists yet - this is expected
        setStatus(null);
      } else {
        setError("Failed to fetch Stripe status");
      }
    } catch (err) {
      console.error("Error fetching Stripe status:", err);
      setError("Failed to fetch Stripe status");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setCreating(true);
    setError(null);

    try {
      // Get tenant email from localStorage or use placeholder
      const tenantToken = localStorage.getItem("tenantToken");
      let email = "admin@example.com"; // Default
      let businessName = "My Business"; // Default

      // In a real app, you'd decode the JWT or fetch tenant info
      // For now, we'll prompt for this info
      const emailInput = prompt("Enter your business email:");
      const nameInput = prompt("Enter your business name:");

      if (!emailInput || !nameInput) {
        setCreating(false);
        return;
      }

      email = emailInput;
      businessName = nameInput;

      const result = await api.tenantAdminCreateStripeAccount({
        body: {
          email,
          businessName,
          country: "US",
        },
      });

      if (result.status === 201) {
        // Account created, now fetch status
        await fetchStatus();
        // Automatically start onboarding
        await handleOnboard();
      } else if (result.status === 409) {
        setError("Stripe account already exists");
        await fetchStatus();
      } else {
        setError("Failed to create Stripe account");
      }
    } catch (err) {
      console.error("Error creating Stripe account:", err);
      setError("Failed to create Stripe account");
    } finally {
      setCreating(false);
    }
  };

  const handleOnboard = async () => {
    setOnboarding(true);
    setError(null);

    try {
      const baseUrl = window.location.origin;
      const refreshUrl = `${baseUrl}/tenant-admin`;
      const returnUrl = `${baseUrl}/tenant-admin?stripe_onboarding=complete`;

      const result = await api.tenantAdminGetStripeOnboardingLink({
        body: {
          refreshUrl,
          returnUrl,
        },
      });

      if (result.status === 200 && result.body) {
        // Redirect to Stripe onboarding
        window.location.href = result.body.url;
      } else if (result.status === 404) {
        setError("No Stripe account found. Create one first.");
      } else {
        setError("Failed to generate onboarding link");
      }
    } catch (err) {
      console.error("Error generating onboarding link:", err);
      setError("Failed to generate onboarding link");
    } finally {
      setOnboarding(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      const result = await api.tenantAdminGetStripeDashboardLink({
        body: undefined,
      });

      if (result.status === 200 && result.body) {
        // Open Stripe dashboard in new tab
        window.open(result.body.url, "_blank");
      } else {
        setError("Failed to generate dashboard link");
      }
    } catch (err) {
      console.error("Error generating dashboard link:", err);
      setError("Failed to generate dashboard link");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          <span className="ml-2 text-neutral-600">Loading Stripe status...</span>
        </div>
      </div>
    );
  }

  // No account exists
  if (!status) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Connect Stripe
        </h3>
        <p className="text-neutral-600 mb-4">
          Connect your Stripe account to start accepting payments from customers.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <Button
          onClick={handleCreateAccount}
          disabled={creating}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Stripe Account
            </>
          )}
        </Button>
      </div>
    );
  }

  // Account exists - show status
  const isFullyOnboarded = status.chargesEnabled && status.payoutsEnabled && status.detailsSubmitted;
  const hasRequirements = status.requirements.currentlyDue.length > 0 || status.requirements.pastDue.length > 0;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">
          Stripe Connect
        </h3>
        {isFullyOnboarded && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Account ID:</span>
          <code className="text-xs bg-neutral-100 px-2 py-1 rounded font-mono">
            {status.accountId}
          </code>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Charges Enabled:</span>
          {status.chargesEnabled ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600" />
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Payouts Enabled:</span>
          {status.payoutsEnabled ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600" />
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Details Submitted:</span>
          {status.detailsSubmitted ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600" />
          )}
        </div>
      </div>

      {hasRequirements && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <h4 className="text-sm font-medium text-amber-900 mb-2">
            Action Required
          </h4>
          {status.requirements.pastDue.length > 0 && (
            <p className="text-xs text-amber-800 mb-1">
              <strong>Past Due:</strong> {status.requirements.pastDue.join(", ")}
            </p>
          )}
          {status.requirements.currentlyDue.length > 0 && (
            <p className="text-xs text-amber-800">
              <strong>Currently Due:</strong> {status.requirements.currentlyDue.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {!isFullyOnboarded && (
          <Button
            onClick={handleOnboard}
            disabled={onboarding}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
          >
            {onboarding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Complete Setup
              </>
            )}
          </Button>
        )}

        <Button
          onClick={handleOpenDashboard}
          variant="outline"
          className={!isFullyOnboarded ? "" : "flex-1"}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Dashboard
        </Button>
      </div>
    </div>
  );
}
