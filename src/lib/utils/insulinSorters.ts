import type { AvailabilityEntity } from '../../core/entities/availability';

export type SortOption = 'level3-count' | 'total-quantity' | 'level-and-quantity';

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
 * Apply sorting based on the selected option
 */
export function sortAvailability(data: AvailabilityEntity[], sortOption: SortOption): AvailabilityEntity[] {
  switch (sortOption) {
    case 'level3-count':
      return sortByLevel3Count(data);
    case 'total-quantity':
      return sortByTotalQuantity(data);
    case 'level-and-quantity':
    default:
      return sortByLevelAndQuantity(data);
  }
}