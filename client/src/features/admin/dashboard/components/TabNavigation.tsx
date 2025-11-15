import { cn } from "@/lib/utils";

type TabValue = "bookings" | "blackouts" | "packages";

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
    { value: "bookings", label: "Bookings" },
    { value: "blackouts", label: "Blackouts" },
    { value: "packages", label: "Packages" },
  ];

  return (
    <div className="border-b border-navy-600">
      <nav className="flex -mb-px space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-lg transition-colors",
              activeTab === tab.value
                ? "border-lavender-500 text-lavender-300"
                : "border-transparent text-lavender-100 hover:text-lavender-300 hover:border-navy-500"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
