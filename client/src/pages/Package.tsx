import { Container } from "../ui/Container";
import { PackagePage } from "../features/catalog/PackagePage";
import { useBranding } from "../hooks/useBranding";

export function Package() {
  // Load and apply tenant branding
  useBranding();

  return (
    <Container className="py-16">
      <PackagePage />
    </Container>
  );
}
