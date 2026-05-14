/**
 * Location Service
 * Handles reverse geocoding using OpenStreetMap Nominatim API
 */

export const getPlaceName = async (latitude, longitude) => {
  if (!latitude || !longitude) return "-";

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
      { 
        headers: { "User-Agent": "PrivilegesApp" } 
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status}`);
    }

    const data = await response.json();
    return data.display_name || "-";
  } catch (error) {
    console.error("Error fetching location name:", error);
    return "-";
  }
};