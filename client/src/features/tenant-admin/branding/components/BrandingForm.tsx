import { Save, Loader2, AlertCircle, Image, Palette, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputEnhanced } from "@/components/ui/input-enhanced";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  logoUrl: string;
  isSaving: boolean;
  error: string | null;
  onPrimaryColorChange: (color: string) => void;
  onSecondaryColorChange: (color: string) => void;
  onAccentColorChange: (color: string) => void;
  onBackgroundColorChange: (color: string) => void;
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
  accentColor,
  backgroundColor,
  fontFamily,
  logoUrl,
  isSaving,
  error,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onAccentColorChange,
  onBackgroundColorChange,
  onFontFamilyChange,
  onLogoUrlChange,
  onSubmit,
}: BrandingFormProps) {
  return (
    <TooltipProvider>
      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <h2 className="text-2xl font-semibold mb-4 text-macon-navy-50">Customize Branding</h2>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 border border-macon-navy-600 bg-macon-navy-700 rounded-lg">
            <AlertCircle className="w-5 h-5 text-macon-navy-200" />
            <span className="text-base text-macon-navy-100">{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Primary Color */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="primaryColor" className="text-macon-navy-100 text-lg">
                Primary Color
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-macon-navy-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Main brand color used for buttons, links, and primary accents</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-3">
              <InputEnhanced
                id="primaryColor"
                type="text"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                placeholder="#9b87f5"
                leftIcon={<Palette className="w-5 h-5" />}
                className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500"
                disabled={isSaving}
              />
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                className="w-16 h-14 rounded border-2 border-macon-navy-600 bg-macon-navy-900 cursor-pointer"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="secondaryColor" className="text-macon-navy-100 text-lg">
                Secondary Color
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-macon-navy-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Supporting color for highlights and secondary actions</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-3">
              <InputEnhanced
                id="secondaryColor"
                type="text"
                value={secondaryColor}
                onChange={(e) => onSecondaryColorChange(e.target.value)}
                placeholder="#fb923c"
                leftIcon={<Palette className="w-5 h-5" />}
                className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500"
                disabled={isSaving}
              />
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => onSecondaryColorChange(e.target.value)}
                className="w-16 h-14 rounded border-2 border-macon-navy-600 bg-macon-navy-900 cursor-pointer"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="accentColor" className="text-macon-navy-100 text-lg">
                Accent Color
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-macon-navy-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Accent color for success states, highlights, and special elements</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-3">
              <InputEnhanced
                id="accentColor"
                type="text"
                value={accentColor}
                onChange={(e) => onAccentColorChange(e.target.value)}
                placeholder="#38b2ac"
                leftIcon={<Palette className="w-5 h-5" />}
                className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500"
                disabled={isSaving}
              />
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onAccentColorChange(e.target.value)}
                className="w-16 h-14 rounded border-2 border-macon-navy-600 bg-macon-navy-900 cursor-pointer"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="backgroundColor" className="text-macon-navy-100 text-lg">
                Background Color
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-macon-navy-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Main background color used throughout your booking widget</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-3">
              <InputEnhanced
                id="backgroundColor"
                type="text"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange(e.target.value)}
                placeholder="#ffffff"
                leftIcon={<Palette className="w-5 h-5" />}
                className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500"
                disabled={isSaving}
              />
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange(e.target.value)}
                className="w-16 h-14 rounded border-2 border-macon-navy-600 bg-macon-navy-900 cursor-pointer"
                disabled={isSaving}
              />
            </div>
          </div>

        {/* Font Family */}
        <div className="space-y-2">
          <Label htmlFor="fontFamily" className="text-macon-navy-100 text-lg">
            Font Family
          </Label>
          <select
            id="fontFamily"
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            className="w-full h-12 px-3 bg-macon-navy-900 border border-macon-navy-600 text-macon-navy-50 rounded-md focus:border-macon-navy-500 focus:outline-none text-lg"
            disabled={isSaving}
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-base text-macon-navy-200">Typography for your booking widget</p>
        </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="logoUrl" className="text-macon-navy-100 text-lg">
                Logo URL (Optional)
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-macon-navy-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>URL to your logo image (PNG, JPG, or SVG format recommended)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <InputEnhanced
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => onLogoUrlChange(e.target.value)}
              placeholder="https://example.com/logo.png"
              leftIcon={<Image className="w-5 h-5" />}
              clearable
              onClear={() => onLogoUrlChange('')}
              helperText="Enter a public URL to your logo image"
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500"
              disabled={isSaving}
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <Button
              type="submit"
              isLoading={isSaving}
              loadingText="Saving branding..."
              className="w-full bg-macon-navy hover:bg-macon-navy-dark text-lg h-12 px-6"
            >
              <Save className="w-5 h-5 mr-2" />
              Save Branding
            </Button>
          </div>
        </form>
      </Card>
    </TooltipProvider>
  );
}
