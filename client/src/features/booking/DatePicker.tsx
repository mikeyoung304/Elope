import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { toUtcMidnight } from "@elope/shared";
import { api } from "../../lib/api";
import "react-day-picker/style.css";

interface DatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

export function DatePicker({ selected, onSelect }: DatePickerProps) {
  const today = new Date();
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Handle date selection with availability check
  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) {
      onSelect(undefined);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const dateStr = toUtcMidnight(date);
      const response = await api.getAvailability({ query: { date: dateStr } });

      if (response.status === 200 && response.body.available) {
        onSelect(date);
      } else {
        // Add to unavailable dates and show feedback
        setUnavailableDates((prev) => [...prev, date]);
        alert(`Sorry, ${dateStr} is not available. Please choose another date.`);
        onSelect(undefined);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      // On error, allow selection (fail open)
      onSelect(date);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Select a date for your ceremony. Dates are checked in real-time for availability.
        </p>
      </div>
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={handleDateSelect}
        disabled={[
          { before: today },
          ...unavailableDates
        ]}
        className="border rounded-lg p-4"
        modifiersClassNames={{
          selected: 'bg-blue-600 text-white',
          disabled: 'text-gray-300 cursor-not-allowed',
        }}
      />
      {isCheckingAvailability && (
        <div className="mt-4 text-sm text-blue-600 text-center">
          Checking availability...
        </div>
      )}
      <div className="mt-4 flex items-start gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded border border-gray-300"></div>
          <span className="text-gray-600">Unavailable</span>
        </div>
      </div>
    </div>
  );
}
