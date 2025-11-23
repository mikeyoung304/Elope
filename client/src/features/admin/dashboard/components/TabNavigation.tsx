import { cn } from "@/lib/utils";

type TabValue = "bookings" | "blackouts" | "packages" | "tenants";

interface TabNavigationProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

/**
 * TabNavigation Component
 *
 * Tab navigation for the admin dashboard
 */
export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { value: TabValue; label: string }[] = [
    { value: "tenants", label: "Tenants" },
    { value: "bookings", label: "Bookings" },
    { value: "blackouts", label: "Blackouts" },
    { value: "packages", label: "Packages" },
  ];

  return (
    <div className="border-b border-macon-navy-600">
      <nav className="flex -mb-px space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-lg transition-colors min-h-[44px]",
              activeTab === tab.value
                ? "border-macon-navy-500 text-macon-navy-300"
                : "border-transparent text-macon-navy-100 hover:text-macon-navy-300 hover:border-macon-navy-500"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
