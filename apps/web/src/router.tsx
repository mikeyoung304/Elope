import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { Home } from "./pages/Home";
import { Package } from "./pages/Package";
import { Success } from "./pages/Success";
import { AdminLogin } from "./pages/AdminLogin";
import { Admin } from "./pages/Admin";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "package/:slug",
        element: <Package />,
      },
      {
        path: "success",
        element: <Success />,
      },
      {
        path: "admin/login",
        element: <AdminLogin />,
      },
      {
        path: "admin",
        element: <Admin />,
      },
    ],
  },
]);
