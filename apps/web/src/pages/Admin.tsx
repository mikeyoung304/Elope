import { Container } from "../ui/Container";
import { Dashboard } from "../features/admin/Dashboard";

export function Admin() {
  return (
    <Container className="py-12">
      <Dashboard />
    </Container>
  );
}
