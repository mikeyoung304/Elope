import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputEnhanced } from "@/components/ui/input-enhanced";
import { Mail, Lock } from "lucide-react";
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
      <Card className="max-w-md mx-auto bg-macon-navy-800 border-macon-navy-600">
        <CardHeader>
          <CardTitle className="text-center text-macon-navy-50 text-3xl">Login</CardTitle>
          <p className="text-center text-macon-navy-200 text-sm mt-2">
            Platform Admin or Tenant Admin
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-3 bg-macon-navy-700 border border-red-500 text-red-100 rounded text-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputEnhanced
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              label="Email"
              floatingLabel
              leftIcon={<Mail className="w-5 h-5" />}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500"
              required
              disabled={isLoading}
              autoComplete="email"
            />
            <InputEnhanced
              id="password"
              type="password"
              value={values.password}
              onChange={(e) => handleChange('password', e.target.value)}
              label="Password"
              floatingLabel
              leftIcon={<Lock className="w-5 h-5" />}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              className="w-full bg-macon-navy hover:bg-macon-navy-dark text-xl h-14"
              isLoading={isLoading}
              loadingText="Logging in..."
            >
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
