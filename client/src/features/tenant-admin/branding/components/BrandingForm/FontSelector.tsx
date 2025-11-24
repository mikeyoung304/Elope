/**
 * FontSelector Component
 *
 * Font family selection dropdown
 */

import { Label } from "@/components/ui/label";

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Sans-serif)" },
  { value: "Playfair Display", label: "Playfair Display (Serif)" },
  { value: "Lora", label: "Lora (Serif)" },
  { value: "Montserrat", label: "Montserrat (Sans-serif)" },
  { value: "Roboto", label: "Roboto (Sans-serif)" },
];

interface FontSelectorProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function FontSelector({ value, disabled = false, onChange }: FontSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="fontFamily" className="text-macon-navy-100 text-lg">
        Font Family
      </Label>
      <select
        id="fontFamily"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-3 bg-macon-navy-900 border border-macon-navy-600 text-macon-navy-50 rounded-md focus:border-macon-navy-500 focus:outline-none text-lg"
        disabled={disabled}
      >
        {FONT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-base text-macon-navy-200">Typography for your booking widget</p>
    </div>
  );
}