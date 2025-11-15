import { Card } from "@/components/ui/card";

interface BrandingPreviewProps {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

/**
 * BrandingPreview Component
 *
 * Live preview of branding settings
 */
export function BrandingPreview({ primaryColor, secondaryColor, fontFamily }: BrandingPreviewProps) {
  return (
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
  );
}
