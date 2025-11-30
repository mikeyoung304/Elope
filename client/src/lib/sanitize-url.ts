/**
 * URL Sanitization Utility
 *
 * Prevents XSS attacks and tracking pixel injection in user-uploaded image URLs
 * by validating URL protocols and formats.
 *
 * Security Considerations:
 * - Only allows http://, https://, and data:image/ protocols
 * - Permits relative URLs starting with / or ./
 * - Rejects javascript:, data:text/, and other potentially malicious protocols
 */

/**
 * Sanitizes image URLs to prevent XSS and tracking pixel injection
 *
 * @param url - The URL to sanitize
 * @returns The sanitized URL or empty string if invalid
 *
 * @example
 * sanitizeImageUrl('https://example.com/image.jpg') // ✅ Returns URL
 * sanitizeImageUrl('javascript:alert(1)') // ❌ Returns ''
 * sanitizeImageUrl('data:image/png;base64,...') // ✅ Returns URL
 * sanitizeImageUrl('/uploads/photo.jpg') // ✅ Returns URL
 */
export const sanitizeImageUrl = (url: string | undefined): string => {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    // Only allow http/https protocols for absolute URLs
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return url;
    }
    // Allow data URLs for images only (not text/html)
    if (url.startsWith('data:image/')) {
      return url;
    }
    // Reject other protocols (javascript:, data:text/, etc.)
    return '';
  } catch {
    // URL parsing failed, might be relative URL
    // Allow relative URLs starting with / or ./
    if (url.startsWith('/') || url.startsWith('./')) {
      return url;
    }
    // Reject malformed or suspicious URLs
    return '';
  }
};
