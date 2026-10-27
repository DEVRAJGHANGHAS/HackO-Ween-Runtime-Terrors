/**
 * Haversine formula calculation in kilometers
 */
function calculateDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2) return 5.0;
  const lat1 = Array.isArray(coord1) ? coord1[0] : (coord1.lat || 28.4595);
  const lon1 = Array.isArray(coord1) ? coord1[1] : (coord1.lng || 77.0266);
  const lat2 = Array.isArray(coord2) ? coord2[0] : (coord2.lat || 28.4595);
  const lon2 = Array.isArray(coord2) ? coord2[1] : (coord2.lng || 77.0266);

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

module.exports = { calculateDistanceKm };
