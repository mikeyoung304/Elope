/**
 * TabNavigation Component
 *
 * Tab navigation for dashboard sections
 */

import { cn } from "@/lib/utils";

export type DashboardTab = "packages" | "segments" | "blackouts" | "bookings" | "branding" | "payments";

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: DashboardTab; label: string }[] = [
    { id: "packages", label: "Packages" },
    { id: "segments", label: "Segments" },
    { id: "blackouts", label: "Blackouts" },
    { id: "bookings", label: "Bookings" },
    { id: "branding", label: "Branding" },
    { id: "payments", label: "Payments" },
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
                ? "border-macon-orange text-macon-navy-900 font-semibold"
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