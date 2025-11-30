/**
 * Layout for public tenant storefronts at /t/:tenantSlug/*
 *
 * Resolves tenant from URL slug, sets API key for X-Tenant-Key header,
 * applies tenant branding via CSS variables, and provides white-label experience.
 *
 * @example
 * /t/little-bit-farm → Loads Little Bit Farm's storefront
 * /t/little-bit-farm/s/wellness → Segment tier page
 * /t/little-bit-farm/book → Appointment booking
 */

import { useEffect, useState } from 'react';
import { Outlet, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, baseUrl } from '../lib/api';
import { Loading } from '../ui/Loading';
import { Container } from '../ui/Container';
import type { TenantPublicDto } from '@macon/contracts';

export function TenantStorefrontLayout() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [apiKeySet, setApiKeySet] = useState(false);

  // Fetch tenant by slug
  const { data: tenant, isLoading, error } = useQuery<TenantPublicDto>({
    queryKey: ['tenant-public', tenantSlug],
    queryFn: async () => {
      // Build the URL manually since this is a new endpoint
      const response = await fetch(`${baseUrl}/v1/public/tenants/${tenantSlug}`);
      if (response.status === 200) {
        return response.json();
      }
      if (response.status === 404) {
        throw new Error('Tenant not found');
      }
      throw new Error('Failed to fetch tenant');
    },
    enabled: !!tenantSlug,
    staleTime: 1000 * 60 * 15, // Cache 15 minutes
  });

  // Set API key when tenant loads
  useEffect(() => {
    if (tenant?.apiKeyPublic) {
      api.setTenantKey(tenant.apiKeyPublic);
      setApiKeySet(true);
    }
    return () => {
      api.setTenantKey(null); // Clear on unmount
      setApiKeySet(false);
    };
  }, [tenant?.apiKeyPublic]);

  // Apply branding CSS variables
  useEffect(() => {
    if (tenant?.branding) {
      const root = document.documentElement;
      const b = tenant.branding;
      if (b.primaryColor) {
        root.style.setProperty('--color-primary', b.primaryColor);
        root.style.setProperty('--macon-navy', b.primaryColor);
      }
      if (b.secondaryColor) {
        root.style.setProperty('--color-secondary', b.secondaryColor);
        root.style.setProperty('--macon-orange', b.secondaryColor);
      }
      if (b.accentColor) {
        root.style.setProperty('--color-accent', b.accentColor);
        root.style.setProperty('--macon-teal', b.accentColor);
      }
      if (b.backgroundColor) {
        root.style.setProperty('--color-background', b.backgroundColor);
      }
    }
    return () => {
      // Reset branding on unmount
      const root = document.documentElement;
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-secondary');
      root.style.removeProperty('--color-accent');
      root.style.removeProperty('--color-background');
      root.style.removeProperty('--macon-navy');
      root.style.removeProperty('--macon-orange');
      root.style.removeProperty('--macon-teal');
    };
  }, [tenant?.branding]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading label="Loading storefront" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Container className="py-20 text-center flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-gray-900">Storefront Not Found</h1>
          <p className="mt-2 text-gray-600">
            The business you're looking for doesn't exist or is no longer active.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Return to MaconAI
          </Link>
        </Container>
      </div>
    );
  }

  // Wait for API key to be set before rendering children
  if (!apiKeySet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading label="Setting up" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Minimal tenant header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <Container>
          <div className="flex items-center justify-between py-4">
            <Link
              to={`/t/${tenant.slug}`}
              className="text-xl font-semibold"
              style={{ color: tenant.branding?.primaryColor || 'var(--color-primary)' }}
            >
              {tenant.branding?.logoUrl ? (
                <img
                  src={tenant.branding.logoUrl}
                  alt={tenant.name}
                  className="h-10 w-auto"
                />
              ) : (
                tenant.name
              )}
            </Link>
          </div>
        </Container>
      </header>

      {/* Main content - existing storefront components */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Powered by footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <Container>
          <div className="py-6 text-center text-sm text-gray-500">
            <span>&copy; {new Date().getFullYear()} {tenant.name}</span>
            <span className="mx-2">&middot;</span>
            <a
              href="https://maconaisolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Powered by MaconAI
            </a>
          </div>
        </Container>
      </footer>
    </div>
  );
}
