// src/modules/pkl/utils/gps.helper.ts

/**
 * GPS Helper Functions
 * Menghitung jarak antara 2 koordinat menggunakan Haversine Formula
 */

const EARTH_RADIUS_METERS = 6371000; // Radius bumi dalam meter

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 Latitude point 1
 * @param lng1 Longitude point 1
 * @param lat2 Latitude point 2
 * @param lng2 Longitude point 2
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_METERS * c;

  return Math.round(distance); // Return in meters, rounded
}

/**
 * Check if current location is within radius of target location
 * @param currentLat Current latitude
 * @param currentLng Current longitude
 * @param targetLat Target latitude
 * @param targetLng Target longitude
 * @param radiusMeters Radius in meters
 * @returns Object with isValid boolean and distance in meters
 */
export function isWithinRadius(
  currentLat: number,
  currentLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number
): { isValid: boolean; distance: number } {
  const distance = calculateDistance(currentLat, currentLng, targetLat, targetLng);

  return {
    isValid: distance <= radiusMeters,
    distance,
  };
}

/**
 * Validate GPS coordinates
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
