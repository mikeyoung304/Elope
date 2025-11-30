/**
 * BrandingForm Component
 *
 * Form for editing branding settings with modular sub-components
 * Design: Matches landing page aesthetic with sage accents
 */

import { Save, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ColorInput } from "./ColorInput";
import { FontSelector } from "./FontSelector";
import { LogoSection } from "./LogoSection";
import { ErrorMessage } from "./ErrorMessage";

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
      <div className="bg-surface-alt rounded-2xl border border-sage-light/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center">
            <Palette className="w-5 h-5 text-sage" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-text-primary">Colors & Typography</h3>
            <p className="text-sm text-text-muted">Define your brand palette</p>
          </div>
        </div>

        <ErrorMessage error={error} />

        <form onSubmit={onSubmit} className="space-y-5">
          <ColorInput
            id="primaryColor"
            label="Primary Color"
            value={primaryColor}
            placeholder="#9b87f5"
            helpText="Main brand color used for buttons, links, and primary accents"
            disabled={isSaving}
            onChange={onPrimaryColorChange}
          />

          <ColorInput
            id="secondaryColor"
            label="Secondary Color"
            value={secondaryColor}
            placeholder="#d97706"
            helpText="Supporting color for highlights and secondary actions"
            disabled={isSaving}
            onChange={onSecondaryColorChange}
          />

          <ColorInput
            id="accentColor"
            label="Accent Color"
            value={accentColor}
            placeholder="#0d9488"
            helpText="Accent color for success states, highlights, and special elements"
            disabled={isSaving}
            onChange={onAccentColorChange}
          />

          <ColorInput
            id="backgroundColor"
            label="Background Color"
            value={backgroundColor}
            placeholder="#ffffff"
            helpText="Main background color used throughout your booking widget"
            disabled={isSaving}
            onChange={onBackgroundColorChange}
          />

          <FontSelector
            value={fontFamily}
            disabled={isSaving}
            onChange={onFontFamilyChange}
          />

          <LogoSection
            logoUrl={logoUrl}
            disabled={isSaving}
            onLogoUrlChange={onLogoUrlChange}
          />

          {/* Save Button */}
          <div className="pt-4">
            <Button
              type="submit"
              isLoading={isSaving}
              loadingText="Saving..."
              className="w-full bg-sage hover:bg-sage-hover text-white h-11 rounded-full shadow-soft hover:shadow-medium transition-all duration-300"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Branding
            </Button>
          </div>
        </form>
      </div>
    </TooltipProvider>
  );
}