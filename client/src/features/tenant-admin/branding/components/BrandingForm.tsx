import { Save, Loader2, AlertCircle, Image } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Sans-serif)" },
  { value: "Playfair Display", label: "Playfair Display (Serif)" },
  { value: "Lora", label: "Lora (Serif)" },
  { value: "Montserrat", label: "Montserrat (Sans-serif)" },
  { value: "Roboto", label: "Roboto (Sans-serif)" },
];

interface BrandingFormProps {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl: string;
  isSaving: boolean;
  error: string | null;
  onPrimaryColorChange: (color: string) => void;
  onSecondaryColorChange: (color: string) => void;
  onFontFamilyChange: (font: string) => void;
  onLogoUrlChange: (url: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * BrandingForm Component
 *
 * Form for editing branding settings
 */
export function BrandingForm({
  primaryColor,
  secondaryColor,
  fontFamily,
  logoUrl,
  isSaving,
  error,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onFontFamilyChange,
  onLogoUrlChange,
  onSubmit,
}: BrandingFormProps) {
  return (
    <Card className="p-6 bg-navy-800 border-navy-600">
      <h2 className="text-2xl font-semibold mb-4 text-lavender-50">Customize Branding</h2>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 border border-navy-600 bg-navy-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-lavender-200" />
          <span className="text-base text-lavender-100">{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Primary Color */}
        <div className="space-y-2">
          <Label htmlFor="primaryColor" className="text-lavender-100 text-lg">
            Primary Color
          </Label>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                id="primaryColor"
                type="text"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                placeholder="#9b87f5"
                className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                disabled={isSaving}
              />
            </div>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="w-16 h-12 rounded border-2 border-navy-600 bg-navy-900 cursor-pointer"
              disabled={isSaving}
            />
          </div>
          <p className="text-base text-lavender-200">Main brand color for buttons and accents</p>
        </div>

        {/* Secondary Color */}
        <div className="space-y-2">
          <Label htmlFor="secondaryColor" className="text-lavender-100 text-lg">
            Secondary Color
          </Label>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                id="secondaryColor"
                type="text"
                value={secondaryColor}
                onChange={(e) => onSecondaryColorChange(e.target.value)}
                placeholder="#7e69ab"
                className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                disabled={isSaving}
              />
            </div>
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => onSecondaryColorChange(e.target.value)}
              className="w-16 h-12 rounded border-2 border-navy-600 bg-navy-900 cursor-pointer"
              disabled={isSaving}
            />
          </div>
          <p className="text-base text-lavender-200">Supporting color for highlights</p>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <Label htmlFor="fontFamily" className="text-lavender-100 text-lg">
            Font Family
          </Label>
          <select
            id="fontFamily"
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            className="w-full h-12 px-3 bg-navy-900 border border-navy-600 text-lavender-50 rounded-md focus:border-lavender-500 focus:outline-none text-lg"
            disabled={isSaving}
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-base text-lavender-200">Typography for your booking widget</p>
        </div>

        {/* Logo URL */}
        <div className="space-y-2">
          <Label htmlFor="logoUrl" className="text-lavender-100 text-lg">
            Logo URL (Optional)
          </Label>
          <Input
            id="logoUrl"
            type="url"
            value={logoUrl}
            onChange={(e) => onLogoUrlChange(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
            disabled={isSaving}
          />
          <div className="flex items-center gap-2 text-base text-lavender-200">
            <Image className="w-4 h-4" />
            <span>Logo upload will be implemented in Phase 4</span>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-lavender-500 hover:bg-lavender-600 text-lg h-12 px-6"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving ? "Saving..." : <><Save className="w-5 h-5 mr-2" />Save Branding</>}
          </Button>
        </div>
      </form>
    </Card>
  );
}
