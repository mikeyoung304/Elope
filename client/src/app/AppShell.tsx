/**
 * AppShell with minimal aesthetic design
 * Features: Skip link, ARIA landmarks, focus management, clean typography
 */

import { Outlet, Link } from 'react-router-dom';
import { Container } from '@/ui/Container';
import { cn } from '@/lib/utils';
import '@/styles/a11y.css';

const appMode = import.meta.env.VITE_APP_MODE;
const isE2EMode = import.meta.env.VITE_E2E === '1';

export function AppShell() {
  const isMockMode = appMode === 'mock';

  return (
    <div className="min-h-screen bg-white flex flex-col" data-e2e={isE2EMode ? '1' : undefined}>
      {/* Skip link for keyboard navigation */}
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {isMockMode && (
        <div className="bg-navy-800 border-b border-navy-700 py-2">
          <Container>
            <p className="text-base text-lavender-100 text-center tracking-wide uppercase">
              Mock Mode - Using mock data
            </p>
          </Container>
        </div>
      )}

      <header className="bg-navy-900 border-b border-navy-800">
        <Container>
          <div className="flex items-center justify-between py-6">
            <Link
              to="/"
              className={cn(
                'text-3xl tracking-tight text-white',
                'font-serif font-light hover:text-lavender-200 transition-colors',
                'playfair-display'
              )}
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Elope
            </Link>
            <nav aria-label="Primary navigation" className="flex gap-8">
              <Link
                to="/"
                className="text-lg tracking-wide text-lavender-100 hover:text-white transition-colors uppercase"
              >
                Packages
              </Link>
              <Link
                to="/admin/login"
                className="text-lg tracking-wide text-lavender-100 hover:text-white transition-colors uppercase"
              >
                Admin
              </Link>
            </nav>
          </div>
        </Container>
      </header>

      <main id="main" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy-900 border-t border-navy-800 mt-24">
        <Container>
          <div className="py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="md:col-span-2">
                <h3
                  className="text-3xl font-light text-white mb-4 tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Elope
                </h3>
                <p className="text-lg text-lavender-200 leading-relaxed max-w-md">
                  Making your special day stress-free and unforgettable. From intimate ceremonies to
                  luxury celebrations.
                </p>
              </div>
              <div>
                <h4 className="text-base font-medium text-white mb-4 tracking-wide uppercase">
                  Quick Links
                </h4>
                <ul className="space-y-3 text-lg text-lavender-200">
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
                <h4 className="text-base font-medium text-white mb-4 tracking-wide uppercase">
                  Contact
                </h4>
                <ul className="space-y-3 text-lg text-lavender-200">
                  <li>hello@elope.com</li>
                  <li>(555) 123-4567</li>
                  <li>Available 7 days/week</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-navy-800 mt-12 pt-8 text-center">
              <p className="text-base text-lavender-300 tracking-wide">
                &copy; 2025 Elope. All rights reserved.
              </p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
