import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

interface DatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

export function DatePicker({ selected, onSelect }: DatePickerProps) {
  const today = new Date();

  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      disabled={{ before: today }}
      className="border rounded-lg p-4"
    />
  );
}
