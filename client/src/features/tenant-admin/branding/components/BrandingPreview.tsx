import { Calendar, Check, Eye } from "lucide-react";

interface BrandingPreviewProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  logoUrl?: string;
}

/**
 * BrandingPreview Component
 *
 * Enhanced live preview of branding settings with realistic booking widget simulation
 * Design: Matches landing page aesthetic with sage accents
 */
export function BrandingPreview({
  primaryColor,
  secondaryColor,
  accentColor,
  backgroundColor,
  fontFamily,
  logoUrl
}: BrandingPreviewProps) {
  return (
    <div className="bg-surface-alt rounded-2xl border border-sage-light/20 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center">
          <Eye className="w-5 h-5 text-sage" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold text-text-primary">Live Preview</h3>
          <p className="text-sm text-text-muted">See how your branding appears</p>
        </div>
      </div>

      {/* Booking Widget Preview */}
      <div
        className="rounded-2xl shadow-medium overflow-hidden border border-sage-light/10"
        style={{
          backgroundColor: backgroundColor,
          fontFamily: fontFamily,
        }}
      >
        {/* Header with Logo */}
        <div
          className="p-5 flex items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo Preview"
              className="max-h-12 max-w-[180px] object-contain"
            />
          ) : (
            <div className="text-white text-lg font-semibold">Your Logo</div>
          )}
        </div>

        {/* Package Content */}
        <div className="p-5 space-y-4">
          <div>
            <h3
              className="text-lg font-bold mb-1"
              style={{ color: primaryColor }}
            >
              Sample Package
            </h3>
            <p className="text-sm opacity-70">
              A preview of how your packages will look to clients.
            </p>
          </div>

          {/* Price */}
          <div
            className="inline-block px-3 py-1.5 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: `${accentColor}15`,
              color: accentColor,
            }}
          >
            $500.00
          </div>

          {/* Date Picker Mockup */}
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70">
              Select Date
            </label>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: `${primaryColor}30` }}
            >
              <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="opacity-50">Choose a date...</span>
            </div>
          </div>

          {/* Add-on */}
          <div
            className="p-3 rounded-lg border flex items-center gap-3"
            style={{
              borderColor: `${secondaryColor}30`,
              backgroundColor: `${secondaryColor}08`,
            }}
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              <Check className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: secondaryColor }}>
                Add-on Option
              </div>
              <div className="text-xs opacity-60">+$100</div>
            </div>
          </div>

          {/* Book Button */}
          <button
            className="w-full py-2.5 rounded-lg font-medium text-white text-sm transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Color Swatches */}
      <div className="mt-5 grid grid-cols-4 gap-2">
        {[
          { label: "Primary", color: primaryColor },
          { label: "Secondary", color: secondaryColor },
          { label: "Accent", color: accentColor },
          { label: "Background", color: backgroundColor },
        ].map(({ label, color }) => (
          <div key={label} className="text-center">
            <div
              className="h-8 rounded-lg border border-sage-light/20 mb-1"
              style={{ backgroundColor: color }}
            />
            <p className="text-[10px] text-text-muted">{label}</p>
            <p className="text-[10px] font-mono text-text-primary">{color}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
