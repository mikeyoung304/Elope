import { Outlet, Link } from "react-router-dom";
import { Container } from "../ui/Container";

const appMode = import.meta.env.VITE_APP_MODE;
const isE2EMode = import.meta.env.VITE_E2E === "1";

export function AppShell() {
  const isMockMode = appMode === "mock";

  return (
    <div className="min-h-screen bg-gray-50" data-e2e={isE2EMode ? "1" : undefined}>
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

      <footer className="bg-gray-900 text-white mt-16">
        <Container>
          <div className="py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold mb-4">Elope</h3>
                <p className="text-gray-400 mb-4">
                  Making your special day stress-free and unforgettable. From intimate ceremonies to luxury celebrations.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link to="/" className="hover:text-white transition-colors">
                      Packages
                    </Link>
                  </li>
                  <li>
                    <a href="#about" className="hover:text-white transition-colors">
                      About Us
                    </a>
                  </li>
                  <li>
                    <Link to="/admin/login" className="hover:text-white transition-colors">
                      Admin
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>hello@elope.com</li>
                  <li>(555) 123-4567</li>
                  <li>Available 7 days/week</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
              <p>&copy; 2025 Elope. All rights reserved.</p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
