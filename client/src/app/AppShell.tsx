/**
 * AppShell with minimal aesthetic design
 * Features: Skip link, ARIA landmarks, focus management, clean typography, mobile menu
 */

import { Outlet, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Container } from '@/ui/Container';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/contexts/AuthContext';
import { Logo } from '@/components/brand/Logo';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
              <div className="flex items-center gap-4">
                <Logo size="sm" linkTo="/" />
                <Link
                  to="/"
                  className={cn(
                    'text-3xl tracking-tight text-white font-semibold',
                    'hover:text-macon-navy-200 transition-colors'
                  )}
                >
                  Macon AI Solutions
                </Link>
              </div>
              {/* Desktop Navigation */}
              <nav aria-label="Primary navigation" className="hidden md:flex gap-8">
                <Link
                  to="/packages"
                  className="text-lg tracking-wide text-macon-navy-100 hover:text-white transition-colors"
                >
                  Browse Packages
                </Link>
                <Link
                  to="/login"
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

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger className="md:hidden p-2 text-macon-navy-100 hover:text-white transition-colors">
                  <Menu className="w-6 h-6" />
                  <span className="sr-only">Open menu</span>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle className="text-macon-navy text-left">Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-6 mt-8">
                    <Link
                      to="/"
                      className="text-xl text-neutral-900 hover:text-macon-orange transition-colors font-medium"
                    >
                      Home
                    </Link>
                    <Link
                      to="/packages"
                      className="text-xl text-neutral-900 hover:text-macon-orange transition-colors font-medium"
                    >
                      Browse Packages
                    </Link>
                    <Link
                      to="/login"
                      className="text-xl text-neutral-900 hover:text-macon-orange transition-colors font-medium"
                    >
                      Log In
                    </Link>
                    <a
                      href="#about"
                      className="text-xl text-neutral-900 hover:text-macon-orange transition-colors font-medium"
                    >
                      About
                    </a>
                    <a
                      href="#contact"
                      className="text-xl text-neutral-900 hover:text-macon-orange transition-colors font-medium"
                    >
                      Contact Support
                    </a>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </Container>
        </header>

        <main id="main" tabIndex={-1} className="flex-1">
          <Outlet />
        </main>

        <footer className="bg-macon-navy-900 border-t border-macon-navy-800 mt-24">
          <Container>
            <div className="py-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
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
                      <Link to="/login" className="hover:text-white transition-colors">
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
