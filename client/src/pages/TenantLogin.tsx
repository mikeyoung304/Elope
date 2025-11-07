import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TenantLogin as TenantLoginComponent } from "../features/tenant-admin/TenantLogin";
import { api } from "../lib/api";

export function TenantLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const token = localStorage.getItem("tenantToken");
    if (token) {
      navigate("/tenant/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      // Agent 1 will create this endpoint
      const result = await (api as any).tenantLogin({
        body: { email, password },
      });

      if (result.status === 200) {
        // Store token using API helper and navigate to dashboard
        (api as any).setTenantToken(result.body.token);
        navigate("/tenant/dashboard");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <TenantLoginComponent onLogin={handleLogin} error={error} isLoading={isLoading} />
    </div>
  );
}
