import { useNavigate } from "react-router-dom";
import { Container } from "../ui/Container";
import { Login } from "../features/admin/Login";

export function AdminLogin() {
  const navigate = useNavigate();

  const handleLogin = (email: string, password: string) => {
    // TODO: Implement actual login logic with API
    console.log("Login attempt:", { email, password });
    navigate("/admin");
  };

  return (
    <Container className="py-12">
      <Login onLogin={handleLogin} />
    </Container>
  );
}
