import type { AvailabilityEntity } from '../../core/entities/availability';

export type SortOption = 'level3-count' | 'total-quantity' | 'level-and-quantity' | 'distance' | 'min-level';

type EnrichedAvailabilityEntity = AvailabilityEntity & {
  minLevel?: number;
  totalQty?: number;
  distanceKm?: number | null;
};

/**
 * Sort by number of level 3 insulin types (descending)
 */
export function sortByLevel3Count(data: AvailabilityEntity[]): AvailabilityEntity[] {
  return [...data].sort((a, b) => {
    const aLevel3Count = a.quantity.filter(q => q.level === 3).length;
    const bLevel3Count = b.quantity.filter(q => q.level === 3).length;
    return bLevel3Count - aLevel3Count;
  });
}

/**
 * Sort by total insulin quantity (descending)
 */
export function sortByTotalQuantity(data: AvailabilityEntity[]): AvailabilityEntity[] {
  return [...data].sort((a, b) => {
    const aTotal = a.quantity.reduce((sum, q) => sum + q.quantity, 0);
    const bTotal = b.quantity.reduce((sum, q) => sum + q.quantity, 0);
    return bTotal - aTotal;
  });
}

/**
 * Sort by number of level 3 insulin types first, then by total quantity
 */
export function sortByLevelAndQuantity(data: AvailabilityEntity[]): AvailabilityEntity[] {
  return [...data].sort((a, b) => {
    const aLevel3Types = a.quantity.filter(q => q.level === 3);
    const bLevel3Types = b.quantity.filter(q => q.level === 3);
    
    const aLevel3Count = aLevel3Types.length;
    const bLevel3Count = bLevel3Types.length;
    
    if (bLevel3Count !== aLevel3Count) {
      return bLevel3Count - aLevel3Count;
    }
    
    const aTotalQuantity = a.quantity.reduce((sum, q) => sum + q.quantity, 0);
    const bTotalQuantity = b.quantity.reduce((sum, q) => sum + q.quantity, 0);
    
    return bTotalQuantity - aTotalQuantity;
  });
}

/**
 * Sort by distance (ascending) when distance information is available
 * Items without distance information will appear at the end
 */
export function sortByDistance(data: EnrichedAvailabilityEntity[]): EnrichedAvailabilityEntity[] {
  // First filter out items with valid distances
  const withDistance = data.filter(item => item.distanceKm !== null && item.distanceKm !== undefined);
  const withoutDistance = data.filter(item => item.distanceKm === null || item.distanceKm === undefined);
  
  // Sort items with distance by their distance value
  const sortedWithDistance = [...withDistance].sort((a, b) => 
    (a.distanceKm as number) - (b.distanceKm as number)
  );
  
  // Return combined array with sorted distances first, then items without distance
  return [...sortedWithDistance, ...withoutDistance];
}

/**
 * Sort by minimum insulin level first, then total quantity
 */
export function sortByMinLevelAndQuantity(data: EnrichedAvailabilityEntity[]): EnrichedAvailabilityEntity[] {
  return [...data].sort((a, b) => {
    const aMinLevel = a.minLevel ?? 0;
    const bMinLevel = b.minLevel ?? 0;
    
    if (bMinLevel !== aMinLevel) {
      return bMinLevel - aMinLevel; // Higher level first
    }
    
    const aTotalQty = a.totalQty ?? 0;
    const bTotalQty = b.totalQty ?? 0;
    
    return bTotalQty - aTotalQty; // Higher quantity first
  });
}

/**
 * Advanced sorting with multiple criteria, optimized for finding
 * the best available insulin locations
 */
export function sortIntelligent(
  data: EnrichedAvailabilityEntity[],
  useLocation: boolean = false
): EnrichedAvailabilityEntity[] {
  if (useLocation) {
    // When location is enabled, sort by distance first,
    // then by minimum level, then by total quantity
    return [...data].sort((a, b) => {
      // First ensure we handle undefined/null values
      const aDistance = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const bDistance = b.distanceKm ?? Number.POSITIVE_INFINITY;
      
      if (aDistance !== bDistance) {
        return aDistance - bDistance; // Closer first
      }
      
      // Then sort by minimum level (higher is better)
      const aMinLevel = a.minLevel ?? 0;
      const bMinLevel = b.minLevel ?? 0;
      
      if (bMinLevel !== aMinLevel) {
        return bMinLevel - aMinLevel;
      }
      
      // Finally sort by total quantity (higher is better)
      const aTotalQty = a.totalQty ?? 0;
      const bTotalQty = b.totalQty ?? 0;
      
      return bTotalQty - aTotalQty;
    });
  } else {
    // When location is not enabled, sort by minimum level first
    // then by total quantity
    return sortByMinLevelAndQuantity(data);
  }
}

/**
 * Apply sorting based on the selected option
 */
export function sortAvailability(
  data: AvailabilityEntity[] | EnrichedAvailabilityEntity[], 
  sortOption: SortOption
): AvailabilityEntity[] {
  switch (sortOption) {
    case 'level3-count':
      return sortByLevel3Count(data);
    case 'total-quantity':
      return sortByTotalQuantity(data);
    case 'distance':
      return sortByDistance(data as EnrichedAvailabilityEntity[]);
    case 'min-level':
      return sortByMinLevelAndQuantity(data as EnrichedAvailabilityEntity[]);
    case 'level-and-quantity':
    default:
      return sortByLevelAndQuantity(data);
  }
}