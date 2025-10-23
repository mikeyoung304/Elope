import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "../ui/Container";
import { Login } from "../features/admin/Login";
import { api } from "../lib/api";

export function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await api.adminLogin({
        body: { email, password },
      });

      if (result.status === 200) {
        // Store token and navigate to admin dashboard
        localStorage.setItem("adminToken", result.body.token);
        navigate("/admin");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-12">
      <Login onLogin={handleLogin} error={error} isLoading={isLoading} />
    </Container>
  );
}
