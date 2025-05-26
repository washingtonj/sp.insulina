import type { AvailabilityEntity } from '../../core/entities/availability';

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * @param lat1 Latitude of first point 
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Enrich availability data with distance from user location
 * @param data List of availability entities
 * @param userLocation User's location coordinates
 * @returns Original data with distance information added
 */
export function addDistanceToAvailability(
  data: AvailabilityEntity[],
  userLocation: { lat: number; lng: number } | null
): (AvailabilityEntity & { distanceKm: number | null })[] {
  if (!userLocation) {
    return data.map(item => ({ ...item, distanceKm: null }));
  }

  return data.map(entity => {
    const lat = entity.pickup?.address?.latitude;
    const lng = entity.pickup?.address?.longitude;
    
    let distance: number | null = null;
    if (typeof lat === 'number' && typeof lng === 'number' && 
        !isNaN(lat) && !isNaN(lng) &&
        !isNaN(userLocation.lat) && !isNaN(userLocation.lng)) {
      distance = getDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
      
      // Validate the calculated distance
      if (isNaN(distance) || !isFinite(distance)) {
        distance = null;
      } else {
        // Round to 1 decimal place for better UX
        distance = Math.round(distance * 10) / 10;
      }
    }
    
    return {
      ...entity,
      distanceKm: distance
    };
  });
}

/**
 * Sort availability data by distance
 * @param data List of availability entities with distance information
 * @returns Sorted list of entities
 */
export function sortByDistance(
  data: (AvailabilityEntity & { distanceKm: number | null })[]
): (AvailabilityEntity & { distanceKm: number | null })[] {
  // Filter out entries without valid distance information
  const validDistances = data.filter(item => 
    item.distanceKm !== null && 
    item.distanceKm !== undefined && 
    !isNaN(item.distanceKm));
  const noDistances = data.filter(item => 
    item.distanceKm === null || 
    item.distanceKm === undefined || 
    isNaN(item.distanceKm));
  
  // Sort by distance
  const sorted = [...validDistances].sort((a, b) => 
    (a.distanceKm as number) - (b.distanceKm as number)
  );
  
  // Return sorted valid distances first, then items with no distance
  return [...sorted, ...noDistances];
}