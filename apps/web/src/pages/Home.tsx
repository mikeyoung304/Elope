import { Container } from "../ui/Container";
import { CatalogGrid } from "../features/catalog/CatalogGrid";

export function Home() {
  return (
    <Container className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Wedding Packages</h1>
        <p className="text-xl text-gray-600">
          Choose your perfect elopement experience
        </p>
      </div>
      <CatalogGrid />
    </Container>
  );
}
