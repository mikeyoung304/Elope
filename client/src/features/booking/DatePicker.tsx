import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { Calendar, Loader2 } from "lucide-react";
import { toUtcMidnight } from "@elope/shared";
import { api } from "../../lib/api";
import { cn } from "@/lib/utils";
import { queryKeys, queryOptions } from "@/lib/queryClient";
import "react-day-picker/style.css";

interface DatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

// Helper to calculate date range (60 days from today)
function getDateRange() {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 60);

  return {
    startDate: toUtcMidnight(today),
    endDate: toUtcMidnight(endDate),
  };
}

export function DatePicker({ selected, onSelect }: DatePickerProps) {
  const today = new Date();
  const [localUnavailable, setLocalUnavailable] = useState<Date[]>([]);

  // Calculate date range for batch query
  const { startDate, endDate } = useMemo(() => getDateRange(), []);

  // Batch fetch unavailable dates using React Query
  const { data: unavailableData, isLoading } = useQuery({
    queryKey: queryKeys.availability.dateRange(startDate, endDate),
    queryFn: async () => {
      const response = await api.getUnavailableDates?.({
        query: { startDate, endDate },
      });
      return response?.status === 200 ? response.body : { dates: [] };
    },
    staleTime: queryOptions.availability.staleTime,
    gcTime: queryOptions.availability.gcTime,
  });

  // Convert string dates to Date objects
  const unavailableDates = useMemo(() => {
    const dates: Date[] = [];

    // Add fetched unavailable dates
    if (unavailableData?.dates) {
      unavailableData.dates.forEach((dateStr) => {
        const date = new Date(dateStr);
        dates.push(date);
      });
    }

    // Add locally marked unavailable dates
    localUnavailable.forEach((date) => {
      dates.push(date);
    });

    return dates;
  }, [unavailableData, localUnavailable]);

  // Handle date selection with real-time availability check
  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) {
      onSelect(undefined);
      return;
    }

    // Check if date is in our unavailable list
    const dateStr = toUtcMidnight(date);
    const isUnavailable = unavailableDates.some(
      (unavailableDate) => toUtcMidnight(unavailableDate) === dateStr
    );

    if (isUnavailable) {
      alert(`Sorry, ${dateStr} is not available. Please choose another date.`);
      onSelect(undefined);
      return;
    }

    // Double-check with API for edge cases (date just booked, etc.)
    try {
      const response = await api.getAvailability?.({ query: { date: dateStr } });

      if (response?.status === 200 && response.body.available) {
        onSelect(date);
      } else {
        // Add to local unavailable list
        setLocalUnavailable((prev) => [...prev, date]);
        alert(`Sorry, ${dateStr} is not available. Please choose another date.`);
        onSelect(undefined);
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      // On error, allow selection (fail open)
      onSelect(date);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start gap-2">
        <Calendar className="h-5 w-5 mt-0.5 text-lavender-200" />
        <p className="text-lg text-lavender-100">
          Select a date for your ceremony. Unavailable dates are pre-loaded for your
          convenience.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-lavender-300" />
          <span className="ml-3 text-lg text-lavender-100">Loading availability...</span>
        </div>
      ) : (
        <>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDateSelect}
            disabled={[{ before: today }, ...unavailableDates]}
            className={cn(
              "border border-navy-600 rounded-lg p-4 bg-navy-900",
              "rdp-root"
            )}
            modifiersClassNames={{
              selected: "bg-lavender-500 text-white font-medium hover:bg-lavender-600",
              disabled: "text-navy-500 cursor-not-allowed line-through",
              today: "font-semibold text-lavender-100",
            }}
          />

          <div className="mt-6 flex flex-wrap items-center gap-4 text-base">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-lavender-500 rounded border border-navy-600" />
              <span className="text-lavender-100">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-navy-700 rounded border border-navy-600" />
              <span className="text-lavender-100">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-navy-800 rounded border border-navy-600" />
              <span className="text-lavender-100">Unavailable</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
