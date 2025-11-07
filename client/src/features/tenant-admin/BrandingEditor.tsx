import { useState, useCallback, useEffect } from "react";
import { Save, CheckCircle, AlertCircle, Loader2, Image } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../lib/api";

type BrandingDto = {
  id: string;
  tenantId: string;
  primaryColor: string;
  secondaryColor: string;
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

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Sans-serif)" },
  { value: "Playfair Display", label: "Playfair Display (Serif)" },
  { value: "Lora", label: "Lora (Serif)" },
  { value: "Montserrat", label: "Montserrat (Sans-serif)" },
  { value: "Roboto", label: "Roboto (Sans-serif)" },
];

export function BrandingEditor({ branding, isLoading, onBrandingChange }: BrandingEditorProps) {
  const [primaryColor, setPrimaryColor] = useState("#9b87f5");
  const [secondaryColor, setSecondaryColor] = useState("#7e69ab");
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
      setError("Primary color must be a valid hex color (e.g., #9b87f5)");
      return;
    }
    if (!hexColorRegex.test(secondaryColor)) {
      setError("Secondary color must be a valid hex color (e.g., #7e69ab)");
      return;
    }

    setIsSaving(true);

    try {
      const result = await (api as any).tenantUpdateBranding({
        body: {
          primaryColor,
          secondaryColor,
          fontFamily,
          logoUrl: logoUrl || undefined,
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
  }, [primaryColor, secondaryColor, fontFamily, logoUrl, showSuccess, onBrandingChange]);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 border border-lavender-600 bg-navy-700 rounded-lg">
          <CheckCircle className="w-5 h-5 text-lavender-300" />
          <span className="text-lg font-medium text-lavender-100">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Form */}
        <Card className="p-6 bg-navy-800 border-navy-600">
          <h2 className="text-2xl font-semibold mb-4 text-lavender-50">Customize Branding</h2>

          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 border border-navy-600 bg-navy-700 rounded-lg">
              <AlertCircle className="w-5 h-5 text-lavender-200" />
              <span className="text-base text-lavender-100">{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-lavender-300" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
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
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#9b87f5"
                      className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                      disabled={isSaving}
                    />
                  </div>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
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
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#7e69ab"
                      className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
                      disabled={isSaving}
                    />
                  </div>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
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
                  onChange={(e) => setFontFamily(e.target.value)}
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
                  onChange={(e) => setLogoUrl(e.target.value)}
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
          )}
        </Card>

        {/* Live Preview */}
        <Card className="p-6 bg-navy-800 border-navy-600">
          <h2 className="text-2xl font-semibold mb-4 text-lavender-50">Live Preview</h2>
          <p className="text-base text-lavender-200 mb-6">
            See how your branding will appear in the booking widget
          </p>

          {/* Preview Card */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              borderColor: primaryColor,
              backgroundColor: `${primaryColor}10`,
              fontFamily: fontFamily,
            }}
          >
            <h3
              className="text-2xl font-bold mb-2"
              style={{ color: primaryColor }}
            >
              Sample Package
            </h3>
            <p className="text-base mb-4" style={{ color: secondaryColor }}>
              This is how your package descriptions will look with the selected font and colors.
            </p>

            <div className="flex gap-3 mb-4">
              <button
                className="px-4 py-2 rounded font-medium text-white transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded font-medium text-white transition-colors"
                style={{ backgroundColor: secondaryColor }}
              >
                Secondary Button
              </button>
            </div>

            <div
              className="p-4 rounded border"
              style={{
                borderColor: secondaryColor,
                backgroundColor: `${secondaryColor}10`,
              }}
            >
              <p className="text-sm" style={{ color: secondaryColor }}>
                This is a sample info box showing how secondary colors are used for highlights
                and accents throughout your booking experience.
              </p>
            </div>
          </div>

          {/* Color Reference */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-lavender-200 mb-2">Primary Color</p>
              <div
                className="h-12 rounded border-2 border-navy-600"
                style={{ backgroundColor: primaryColor }}
              />
              <p className="text-xs text-lavender-100 mt-1 font-mono">{primaryColor}</p>
            </div>
            <div>
              <p className="text-sm text-lavender-200 mb-2">Secondary Color</p>
              <div
                className="h-12 rounded border-2 border-navy-600"
                style={{ backgroundColor: secondaryColor }}
              />
              <p className="text-xs text-lavender-100 mt-1 font-mono">{secondaryColor}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
