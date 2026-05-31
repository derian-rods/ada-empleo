/**
 * GPSAE Configuration and URL Builder
 *
 * GPSAE is the external system for request tracking.
 * This module provides centralized URL construction for GPSAE links.
 *
 * CONFIGURATION:
 * ===============
 * The GPSAE base URL is configured via the environment variable VITE_GPSAE_BASE_URL
 * which can be set in:
 *   - .env (all environments)
 *   - .env.development (development only)
 *   - .env.production (production only)
 *
 * Example values:
 *   - Development: https://gpsae-dev.ejemplo.es/peticion
 *   - Production: https://gpsae.ejemplo.es/peticion
 *
 * If not configured, defaults to: https://gpsae.ejemplo.es/peticion
 *
 * USAGE:
 * ======
 * 1. Copy .env.example to .env and configure the VITE_GPSAE_BASE_URL
 * 2. Use buildGpsaeRequestUrl(code) to generate links
 * 3. Import in components and use GpsaeRequestLink component
 */

// Base URL for GPSAE (configurable via environment variables)
// If you need to change this, either:
// 1. Set VITE_GPSAE_BASE_URL in .env files
// 2. Or modify this constant directly
export const GPSAE_BASE_URL =
  import.meta.env.VITE_GPSAE_BASE_URL || "https://gpsae.ejemplo.es/peticion";

/**
 * Build a GPSAE URL for a given request code
 * @param requestCode - The request code (e.g., "1234", "5678")
 * @returns Full URL to the request in GPSAE, or empty string if no code
 */
export function buildGpsaeRequestUrl(requestCode: string | undefined): string {
  if (!requestCode || !requestCode.trim()) {
    return "";
  }
  return `${GPSAE_BASE_URL}/${requestCode.trim()}`;
}

/**
 * Check if a request code is valid and can generate a link
 * @param requestCode - The request code to validate
 * @returns true if the code can be used for linking
 */
export function isValidRequestCode(requestCode: string | undefined): boolean {
  return Boolean(requestCode && requestCode.trim().length > 0);
}
