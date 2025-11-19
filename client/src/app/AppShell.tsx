/**
 * AppShell with minimal aesthetic design
 * Features: Skip link, ARIA landmarks, focus management, clean typography
 */

import { Outlet, Link } from 'react-router-dom';
import { Container } from '@/ui/Container';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/styles/a11y.css';

const appMode = import.meta.env.VITE_APP_MODE;
const isE2EMode = import.meta.env.VITE_E2E === '1';

export function AppShell() {
  const isMockMode = appMode === 'mock';

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white flex flex-col" data-e2e={isE2EMode ? '1' : undefined}>
        {/* Skip link for keyboard navigation */}
        <a className="skip-link" href="#main">
          Skip to content
        </a>

        {isMockMode && (
          <div className="bg-macon-navy-800 border-b border-macon-navy-700 py-2">
            <Container>
              <p className="text-base text-macon-navy-100 text-center tracking-wide uppercase">
                Mock Mode - Using mock data
              </p>
            </Container>
          </div>
        )}

        <header className="bg-macon-navy-900 border-b border-macon-navy-800">
          <Container>
            <div className="flex items-center justify-between py-6">
              <Link
                to="/"
                className={cn(
                  'text-3xl tracking-tight text-white font-semibold',
                  'hover:text-macon-navy-200 transition-colors'
                )}
              >
                Macon AI Solutions
              </Link>
              <nav aria-label="Primary navigation" className="flex gap-8">
                <Link
                  to="/admin/login"
                  className="text-lg tracking-wide text-macon-navy-100 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <a
                  href="#contact"
                  className="text-lg tracking-wide text-macon-navy-100 hover:text-white transition-colors"
                >
                  Contact Support
                </a>
              </nav>
            </div>
          </Container>
        </header>

        <main id="main" tabIndex={-1} className="flex-1">
          <Outlet />
        </main>

        <footer className="bg-macon-navy-900 border-t border-macon-navy-800 mt-24">
          <Container>
            <div className="py-16">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="md:col-span-2">
                  <h3 className="text-3xl font-semibold text-white mb-4 tracking-tight">
                    Macon AI Solutions
                  </h3>
                  <p className="text-lg text-macon-navy-200 leading-relaxed max-w-md">
                    Making tenant management effortless through AI-powered automation.
                    Onboard faster, automate smarter, and delight your tenants.
                  </p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-white mb-4 tracking-wide uppercase">
                    Company
                  </h4>
                  <ul className="space-y-3 text-lg text-macon-navy-200">
                    <li>
                      <a href="#about" className="hover:text-white transition-colors">
                        About Us
                      </a>
                    </li>
                    <li>
                      <a href="#careers" className="hover:text-white transition-colors">
                        Careers
                      </a>
                    </li>
                    <li>
                      <Link to="/admin/login" className="hover:text-white transition-colors">
                        Log In
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-base font-medium text-white mb-4 tracking-wide uppercase">
                    Support
                  </h4>
                  <ul className="space-y-3 text-lg text-macon-navy-200">
                    <li>
                      <a href="#contact" className="hover:text-white transition-colors">
                        Contact Support
                      </a>
                    </li>
                    <li>
                      <a href="#privacy" className="hover:text-white transition-colors">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#terms" className="hover:text-white transition-colors">
                        Terms of Service
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-macon-navy-800 mt-12 pt-8 text-center">
                <p className="text-base text-macon-navy-300 tracking-wide">
                  &copy; 2025 Macon AI Solutions. All rights reserved.
                </p>
              </div>
            </div>
          </Container>
        </footer>
      </div>
    </AuthProvider>
  );
}
