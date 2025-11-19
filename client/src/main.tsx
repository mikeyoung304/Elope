import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { router } from "./router";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./providers/ThemeProvider";
import { ErrorBoundary } from "./components/errors";
import { Toaster } from "./components/ui/toaster";
import { api } from "./lib/api";
import { initSentry } from "./lib/sentry";
import "./index.css";

// Initialize Sentry error tracking (optional - gracefully degrades if no DSN)
initSentry();

// Initialize tenant API key for multi-tenant mode
// In production, this would come from the tenant's subdomain or embedding config
// For E2E tests, we use a fixed test tenant key
const tenantApiKey = import.meta.env.VITE_TENANT_API_KEY;
if (tenantApiKey) {
  (api as any).setTenantKey(tenantApiKey);
  console.log('[Elope] Initialized with tenant API key');
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
