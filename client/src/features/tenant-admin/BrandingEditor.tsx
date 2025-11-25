import { useState, useCallback, useEffect } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

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
      console.error("Failed to save branding:", err);
      setError("An error occurred while saving branding");
    } finally {
      setIsSaving(false);
    }
  }, [primaryColor, secondaryColor, accentColor, backgroundColor, fontFamily, logoUrl, showSuccess, onBrandingChange]);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 border border-white/20 bg-macon-navy-700 rounded-lg">
          <CheckCircle className="w-5 h-5 text-white/60" />
          <span className="text-lg font-medium text-white/90">{successMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
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
