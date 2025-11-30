import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { logger } from "../../lib/logger";
import { useSuccessMessage } from "../../hooks/useSuccessMessage";
import { SuccessMessage } from "@/components/shared/SuccessMessage";
import { BrandingForm } from "./branding/components/BrandingForm";
import { BrandingPreview } from "./branding/components/BrandingPreview";

type BrandingDto = {
  id: string;
  tenantId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
};

interface BrandingEditorProps {
  branding: BrandingDto | null;
  isLoading: boolean;
  onBrandingChange: () => void;
}

/**
 * BrandingEditor Component
 *
 * Main coordinator for tenant branding management.
 * Refactored to use separate form and preview components.
 */

export function BrandingEditor({ branding, isLoading, onBrandingChange }: BrandingEditorProps) {
  const [primaryColor, setPrimaryColor] = useState("#1a365d");
  const [secondaryColor, setSecondaryColor] = useState("#d97706");
  const [accentColor, setAccentColor] = useState("#0d9488");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [logoUrl, setLogoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { message: successMessage, showSuccess } = useSuccessMessage();

  // Load branding data when it changes
  useEffect(() => {
    if (branding) {
      setPrimaryColor(branding.primaryColor);
      setSecondaryColor(branding.secondaryColor);
      setAccentColor(branding.accentColor);
      setBackgroundColor(branding.backgroundColor);
      setFontFamily(branding.fontFamily);
      setLogoUrl(branding.logoUrl || "");
    }
  }, [branding]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate hex colors
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    if (!hexColorRegex.test(primaryColor)) {
      setError("Primary color must be a valid hex color (e.g., #1a365d)");
      return;
    }
    if (!hexColorRegex.test(secondaryColor)) {
      setError("Secondary color must be a valid hex color (e.g., #d97706)");
      return;
    }
    if (!hexColorRegex.test(accentColor)) {
      setError("Accent color must be a valid hex color (e.g., #0d9488)");
      return;
    }
    if (!hexColorRegex.test(backgroundColor)) {
      setError("Background color must be a valid hex color (e.g., #ffffff)");
      return;
    }

    setIsSaving(true);

    try {
      const result = await api.tenantAdminUpdateBranding({
        body: {
          primaryColor,
          secondaryColor,
          accentColor,
          backgroundColor,
          fontFamily,
        },
      });

      if (result.status === 200) {
        showSuccess("Branding updated successfully");
        onBrandingChange();
      } else {
        setError("Failed to update branding");
      }
    } catch (err) {
      logger.error("Failed to save branding:", { error: err, component: "BrandingEditor" });
      setError("An error occurred while saving branding");
    } finally {
      setIsSaving(false);
    }
  }, [primaryColor, secondaryColor, accentColor, backgroundColor, fontFamily, logoUrl, showSuccess, onBrandingChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-text-primary">Brand Customization</h2>
          <p className="text-text-muted text-sm mt-1">
            Customize colors and fonts for your booking widget
          </p>
        </div>
      </div>

      {/* Success Message */}
      <SuccessMessage message={successMessage} />

      {isLoading ? (
        <div className="bg-surface-alt rounded-2xl border border-sage-light/20 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sage" />
          <p className="text-text-muted mt-3">Loading branding settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Branding Form */}
          <BrandingForm
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
            backgroundColor={backgroundColor}
            fontFamily={fontFamily}
            logoUrl={logoUrl}
            isSaving={isSaving}
            error={error}
            onPrimaryColorChange={setPrimaryColor}
            onSecondaryColorChange={setSecondaryColor}
            onAccentColorChange={setAccentColor}
            onBackgroundColorChange={setBackgroundColor}
            onFontFamilyChange={setFontFamily}
            onLogoUrlChange={setLogoUrl}
            onSubmit={handleSave}
          />

          {/* Live Preview */}
          <BrandingPreview
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
            backgroundColor={backgroundColor}
            fontFamily={fontFamily}
            logoUrl={logoUrl}
          />
        </div>
      )}
    </div>
  );
}
