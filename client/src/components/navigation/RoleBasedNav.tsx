/**
 * Role-Based Navigation Component
 * Shows different navigation items based on user role
 */

import { Link } from "react-router-dom";
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
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg",
              "text-lavender-100 hover:text-lavender-50 hover:bg-navy-700",
              "transition-colors"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    );
  }

  // Sidebar variant
  return (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg",
            "text-lavender-100 hover:text-lavender-50 hover:bg-navy-700",
            "transition-colors group"
          )}
        >
          <div className="text-lavender-300 group-hover:text-lavender-50">
            {item.icon}
          </div>
          <div className="flex-1">
            <div className="font-medium">{item.label}</div>
            {item.description && (
              <div className="text-sm text-lavender-300">{item.description}</div>
            )}
          </div>
        </Link>
      ))}
    </nav>
  );
}
