import { Card } from "@/components/ui/card";
import { Calendar, Check } from "lucide-react";

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
    <Card className="p-6 bg-macon-navy-800 border-white/20">
      <h2 className="text-2xl font-semibold mb-4 text-white">Live Preview</h2>
      <p className="text-base text-white/70 mb-6">
        See how your branding will appear in the booking widget
      </p>

      {/* Booking Widget Preview */}
      <div
        className="rounded-lg shadow-xl overflow-hidden"
        style={{
          backgroundColor: backgroundColor,
          fontFamily: fontFamily,
        }}
      >
        {/* Header with Logo */}
        <div
          className="p-6 flex items-center justify-center"
          style={{
            backgroundColor: primaryColor,
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo Preview"
              className="max-h-16 max-w-[200px] object-contain"
            />
          ) : (
            <div className="text-white text-2xl font-bold">Your Logo Here</div>
          )}
        </div>

        {/* Package Content */}
        <div className="p-6">
          <h3
            className="text-2xl font-bold mb-3"
            style={{ color: primaryColor }}
          >
            Premium Consulting Package
          </h3>
          <p className="text-base mb-4 opacity-80">
            A comprehensive service session with professional guidance
            and personalized recommendations.
          </p>

          {/* Price */}
          <div
            className="inline-block px-4 py-2 rounded-lg font-bold text-lg mb-4"
            style={{
              backgroundColor: `${accentColor}20`,
              color: accentColor,
              border: `2px solid ${accentColor}`,
            }}
          >
            $500.00
          </div>

          {/* Date Picker Mockup */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: primaryColor }}>
              Select Event Date
            </label>
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-lg border-2"
              style={{ borderColor: primaryColor }}
            >
              <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
              <span className="opacity-60">Choose a date...</span>
            </div>
          </div>

          {/* Add-ons */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: primaryColor }}>
              Optional Add-ons
            </label>
            <div
              className="p-4 rounded-lg border"
              style={{
                borderColor: secondaryColor,
                backgroundColor: `${secondaryColor}10`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium" style={{ color: secondaryColor }}>
                    Professional Videography
                  </div>
                  <div className="text-sm opacity-70">+$300.00</div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Now Button */}
          <button
            className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            Book This Package
          </button>
        </div>
      </div>

      {/* Color Reference */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-white/70 mb-1">Primary</p>
          <div
            className="h-10 rounded border border-white/20"
            style={{ backgroundColor: primaryColor }}
          />
          <p className="text-xs text-white/90 mt-1 font-mono">{primaryColor}</p>
        </div>
        <div>
          <p className="text-xs text-white/70 mb-1">Secondary</p>
          <div
            className="h-10 rounded border border-white/20"
            style={{ backgroundColor: secondaryColor }}
          />
          <p className="text-xs text-white/90 mt-1 font-mono">{secondaryColor}</p>
        </div>
        <div>
          <p className="text-xs text-white/70 mb-1">Accent</p>
          <div
            className="h-10 rounded border border-white/20"
            style={{ backgroundColor: accentColor }}
          />
          <p className="text-xs text-white/90 mt-1 font-mono">{accentColor}</p>
        </div>
        <div>
          <p className="text-xs text-white/70 mb-1">Background</p>
          <div
            className="h-10 rounded border border-white/20"
            style={{ backgroundColor: backgroundColor }}
          />
          <p className="text-xs text-white/90 mt-1 font-mono">{backgroundColor}</p>
        </div>
      </div>
    </Card>
  );
}
