/**
 * BrandingForm Component
 *
 * Form for editing branding settings with modular sub-components
 */

import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
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
      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <h2 className="text-2xl font-semibold mb-4 text-macon-navy-50">Customize Branding</h2>

        <ErrorMessage error={error} />

        <form onSubmit={onSubmit} className="space-y-6">
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