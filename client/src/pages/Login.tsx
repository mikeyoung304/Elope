import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "@/hooks/useForm";
import { useAuth } from "../contexts/AuthContext";

/**
 * Unified Login Page
 * Handles authentication for both Platform Admins and Tenant Admins
 * Routes users to the appropriate dashboard based on their role
 */
export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill for local development/demo - admin by default
  const { values, handleChange } = useForm({
    email: "admin@elope.com",
    password: "admin123"
  });

  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'PLATFORM_ADMIN') {
        navigate("/admin/dashboard");
      } else if (role === 'TENANT_ADMIN') {
        navigate("/tenant/dashboard");
      }
    }
  }, [isAuthenticated, role, navigate]);

  /**
   * Attempt login
   * Tries admin login first, then falls back to tenant login
   * Routes user based on successful authentication type
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Try platform admin login first
      try {
        await login(values.email, values.password, 'PLATFORM_ADMIN');
        navigate("/admin/dashboard");
        return;
      } catch (adminError) {
        // Admin login failed, try tenant login
        try {
          await login(values.email, values.password, 'TENANT_ADMIN');
          navigate("/tenant/dashboard");
          return;
        } catch (tenantError) {
          // Both logins failed
          console.error("Login error:", { adminError, tenantError });
          setError("Invalid credentials. Please check your email and password.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md mx-auto bg-navy-800 border-navy-600">
        <CardHeader>
          <CardTitle className="text-center text-lavender-50 text-3xl">Login</CardTitle>
          <p className="text-center text-lavender-200 text-sm mt-2">
            Platform Admin or Tenant Admin
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-3 bg-navy-700 border border-red-500 text-red-100 rounded text-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lavender-100 text-lg">Email</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-lavender-100 text-lg">Password</Label>
              <Input
                id="password"
                type="password"
                value={values.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-lavender-500 hover:bg-lavender-600 text-xl h-14"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
