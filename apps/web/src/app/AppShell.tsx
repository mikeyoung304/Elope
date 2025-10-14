import { Outlet, Link } from "react-router-dom";
import { Container } from "../ui/Container";

const appMode = import.meta.env.VITE_APP_MODE;

export function AppShell() {
  const isMockMode = appMode === "mock";

  return (
    <div className="min-h-screen bg-gray-50">
      {isMockMode && (
        <div className="bg-yellow-100 border-b border-yellow-200 py-2">
          <Container>
            <p className="text-sm text-yellow-800 text-center font-medium">
              Mock Mode - Using mock data
            </p>
          </Container>
        </div>
      )}

      <header className="bg-white shadow-sm">
        <Container>
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Elope
            </Link>
            <nav className="flex gap-6">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Packages
              </Link>
              <Link
                to="/admin/login"
                className="text-gray-600 hover:text-gray-900"
              >
                Admin
              </Link>
            </nav>
          </div>
        </Container>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-white border-t mt-12">
        <Container>
          <div className="py-8 text-center text-gray-600">
            <p>&copy; 2025 Elope. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
