/**
 * TabNavigation Component
 *
 * Tab navigation for dashboard sections
 */

import { cn } from "@/lib/utils";

export type DashboardTab = "packages" | "blackouts" | "bookings" | "branding";

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: DashboardTab; label: string }[] = [
    { id: "packages", label: "Packages" },
    { id: "blackouts", label: "Blackouts" },
    { id: "bookings", label: "Bookings" },
    { id: "branding", label: "Branding" },
  ];

  return (
    <div className="border-b border-neutral-200">
      <nav className="flex -mb-px space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px]",
              activeTab === tab.id
                ? "border-white/20 text-macon-navy-600"
                : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}