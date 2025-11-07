/**
 * Router with lazy loading for code splitting
 * P0/P1 Implementation
 */

import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "./app/AppShell";
import { Loading } from "./ui/Loading";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const Package = lazy(() => import("./pages/Package").then(m => ({ default: m.Package })));
const Success = lazy(() => import("./pages/Success").then(m => ({ default: m.Success })));
const AdminLogin = lazy(() => import("./pages/AdminLogin").then(m => ({ default: m.AdminLogin })));
const Admin = lazy(() => import("./pages/Admin").then(m => ({ default: m.Admin })));
const TenantLogin = lazy(() => import("./pages/TenantLogin").then(m => ({ default: m.TenantLogin })));
const TenantDashboard = lazy(() => import("./pages/TenantDashboard").then(m => ({ default: m.TenantDashboard })));

// Wrapper with Suspense
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading label="Loading page" />}>{children}</Suspense>
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
        path: "package/:slug",
        element: <SuspenseWrapper><Package /></SuspenseWrapper>,
      },
      {
        path: "success",
        element: <SuspenseWrapper><Success /></SuspenseWrapper>,
      },
      {
        path: "admin/login",
        element: <SuspenseWrapper><AdminLogin /></SuspenseWrapper>,
      },
      {
        path: "admin",
        element: <SuspenseWrapper><Admin /></SuspenseWrapper>,
      },
      {
        path: "tenant/login",
        element: <SuspenseWrapper><TenantLogin /></SuspenseWrapper>,
      },
      {
        path: "tenant/dashboard",
        element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper>,
      },
    ],
  },
]);
