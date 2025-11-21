/**
 * Router with lazy loading for code splitting
 * Role-based routing for PLATFORM_ADMIN and TENANT_ADMIN
 */

import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "./app/AppShell";
import { Loading } from "./ui/Loading";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import type { UserRole } from "./contexts/AuthContext";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const Package = lazy(() => import("./pages/Package").then(m => ({ default: m.Package })));
const PackageCatalog = lazy(() => import("./pages/PackageCatalog").then(m => ({ default: m.PackageCatalog })));
const Success = lazy(() => import("./pages/success").then(m => ({ default: m.Success })));
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const PlatformAdminDashboard = lazy(() => import("./pages/admin/PlatformAdminDashboard").then(m => ({ default: m.PlatformAdminDashboard })));
const TenantAdminDashboard = lazy(() => import("./pages/tenant/TenantAdminDashboard").then(m => ({ default: m.TenantAdminDashboard })));
const SegmentsManager = lazy(() =>
  import("./features/admin/segments").then((m) => ({ default: m.SegmentsManager }))
);
const TenantForm = lazy(() =>
  import("./features/admin/tenants/TenantForm").then((m) => ({ default: m.TenantForm }))
);

// Wrapper with Suspense
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading label="Loading page" />}>{children}</Suspense>
);

// Protected route wrapper with Suspense
const ProtectedSuspenseWrapper = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) => (
  <Suspense fallback={<Loading label="Loading page" />}>
    <ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <SuspenseWrapper><Home /></SuspenseWrapper>,
      },
      {
        path: "packages",
        element: <SuspenseWrapper><PackageCatalog /></SuspenseWrapper>,
      },
      {
        path: "package/:slug",
        element: <SuspenseWrapper><Package /></SuspenseWrapper>,
      },
      {
        path: "success",
        element: <SuspenseWrapper><Success /></SuspenseWrapper>,
      },
      {
        path: "login",
        element: <SuspenseWrapper><Login /></SuspenseWrapper>,
      },
      {
        path: "admin/dashboard",
        element: (
          <ProtectedSuspenseWrapper allowedRoles={["PLATFORM_ADMIN"]}>
            <PlatformAdminDashboard />
          </ProtectedSuspenseWrapper>
        ),
      },
      {
        path: "admin/segments",
        element: (
          <ProtectedSuspenseWrapper allowedRoles={["PLATFORM_ADMIN"]}>
            <SegmentsManager />
          </ProtectedSuspenseWrapper>
        ),
      },
      {
        path: "admin/tenants/new",
        element: (
          <ProtectedSuspenseWrapper allowedRoles={["PLATFORM_ADMIN"]}>
            <TenantForm />
          </ProtectedSuspenseWrapper>
        ),
      },
      {
        path: "admin/tenants/:id",
        element: (
          <ProtectedSuspenseWrapper allowedRoles={["PLATFORM_ADMIN"]}>
            <TenantForm />
          </ProtectedSuspenseWrapper>
        ),
      },
      {
        path: "tenant/dashboard",
        element: (
          <ProtectedSuspenseWrapper allowedRoles={["TENANT_ADMIN"]}>
            <TenantAdminDashboard />
          </ProtectedSuspenseWrapper>
        ),
      },
      // Legacy admin route - redirect to new dashboard
      {
        path: "admin",
        element: <Navigate to="/admin/dashboard" replace />,
      },
      // Legacy routes - redirect to unified login
      {
        path: "admin/login",
        element: <Navigate to="/login" replace />,
      },
      {
        path: "tenant/login",
        element: <Navigate to="/login" replace />,
      },
    ],
  },
]);
