/**
 * Role-Based Navigation Component
 * Shows different navigation items based on user role
 */

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Building2,
  Package,
  Calendar,
  Settings,
  Users,
  Palette,
  XCircle
} from "lucide-react";
import { cn } from "../../lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  description?: string;
}

export function RoleBasedNav({ variant = "sidebar" }: { variant?: "sidebar" | "horizontal" }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return null;
  }

  const platformAdminNav: NavItem[] = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: <Building2 className="w-5 h-5" />,
      description: "System overview"
    },
    {
      label: "Tenants",
      path: "/admin/tenants",
      icon: <Users className="w-5 h-5" />,
      description: "Manage all tenants"
    },
    {
      label: "System Settings",
      path: "/admin/settings",
      icon: <Settings className="w-5 h-5" />,
      description: "Platform configuration"
    }
  ];

  const tenantAdminNav: NavItem[] = [
    {
      label: "Dashboard",
      path: "/tenant/dashboard",
      icon: <Building2 className="w-5 h-5" />,
      description: "Tenant overview"
    },
    {
      label: "Packages",
      path: "/tenant/packages",
      icon: <Package className="w-5 h-5" />,
      description: "Manage packages"
    },
    {
      label: "Bookings",
      path: "/tenant/bookings",
      icon: <Calendar className="w-5 h-5" />,
      description: "View bookings"
    },
    {
      label: "Blackouts",
      path: "/tenant/blackouts",
      icon: <XCircle className="w-5 h-5" />,
      description: "Blackout dates"
    },
    {
      label: "Branding",
      path: "/tenant/branding",
      icon: <Palette className="w-5 h-5" />,
      description: "Customize branding"
    },
    {
      label: "Settings",
      path: "/tenant/settings",
      icon: <Settings className="w-5 h-5" />,
      description: "Tenant settings"
    }
  ];

  const navItems = user.role === "PLATFORM_ADMIN" ? platformAdminNav : tenantAdminNav;

  if (variant === "horizontal") {
    return (
      <nav className="flex gap-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "text-macon-navy-100 hover:text-macon-navy-50 hover:bg-macon-navy-700",
                "transition-colors",
                isActive && "bg-macon-navy-700 text-macon-navy-50 font-semibold"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // Sidebar variant
  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg",
              "text-macon-navy-100 hover:text-macon-navy-50 hover:bg-macon-navy-700",
              "transition-colors group",
              isActive && "bg-macon-navy-700 text-macon-navy-50 border-l-4 border-macon-orange-500"
            )}
          >
            <div className={cn(
              "text-macon-navy-300 group-hover:text-macon-navy-50",
              isActive && "text-macon-orange-500"
            )}>
              {item.icon}
            </div>
            <div className="flex-1">
              <div className={cn(
                "font-medium",
                isActive && "font-semibold"
              )}>{item.label}</div>
              {item.description && (
                <div className="text-sm text-macon-navy-300">{item.description}</div>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
