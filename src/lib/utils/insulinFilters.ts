import type { AvailabilityEntity } from '../../core/entities/availability';

/**
 * Filter availability data by insulin type (AMPOLA, CANETA, REFILL)
 */
export function filterByInsulinType(
  data: AvailabilityEntity[],
  insulinType: string | null
): AvailabilityEntity[] {
  if (!insulinType) return data;
  
  return data.filter(item => 
    item.quantity.some(q => q.insulin.type === insulinType)
  );
}

/**
 * Filter availability data by multiple insulin codes.
 * Only includes locations that have ALL the selected insulin types with quantity > 0.
 */
export function filterByInsulinCodes(
  data: AvailabilityEntity[],
  insulinCodes: string[] | null
): AvailabilityEntity[] {
  if (!insulinCodes || insulinCodes.length === 0) return data;
  
  return data.filter(item => 
    insulinCodes.every(code => 
      item.quantity.some(q => q.insulin.code === code && q.quantity > 0)
    )
  );
}

/**
 * Filter availability data by search query (pickup name or address)
 */
export function filterBySearchQuery(
  data: AvailabilityEntity[],
  searchQuery: string | null
): AvailabilityEntity[] {
  if (!searchQuery) return data;
  
  const query = searchQuery.trim().toLowerCase();
  if (!query) return data;
  
  return data.filter(item => {
    const name = item.pickup?.placeName?.toLowerCase() || '';
    const address = item.pickup?.address?.address?.toLowerCase() || '';
    const district = item.pickup?.address?.district?.toLowerCase() || '';
    return name.includes(query) || address.includes(query) || district.includes(query);
  });
}

/**
 * Filter availability data by specific insulin code (legacy, single selection)
 */
export function filterByInsulinCode(
  data: AvailabilityEntity[],
  insulinCode: string | null
): AvailabilityEntity[] {
  if (!insulinCode) return data;
  
  return data.filter(item => 
    item.quantity.some(q => q.insulin.code === insulinCode && q.quantity > 0)
  );
}

/**
 * Filter availability data by minimum level
 */
export function filterByMinimumLevel(
  data: AvailabilityEntity[],
  minLevel: number
): AvailabilityEntity[] {
  return data.filter(item => 
    item.quantity.some(q => q.level >= minLevel)
  );
}

/**
 * Extract all unique insulins from availability data
 */
export function extractUniqueInsulins(data: AvailabilityEntity[]): Array<{
  type: string;
  simpleName: string;
  code: string;
}> {
  const insulinSet = new Set<string>();
  const insulins: Array<{
    type: string;
    simpleName: string;
    code: string;
  }> = [];
  
  data.forEach(item => {
    item.quantity.forEach(q => {
      const key = q.insulin.code;
      if (!insulinSet.has(key)) {
        insulinSet.add(key);
        insulins.push({
          type: q.insulin.type,
          simpleName: q.insulin.simpleName,
          code: q.insulin.code
        });
      }
    });
  });
  
  // Sort by name for better UX
  return insulins.sort((a, b) => 
    a.simpleName.localeCompare(b.simpleName)
  );
}

/**
 * Apply all filters at once
 */
export function applyAllFilters(
  data: AvailabilityEntity[],
  filters: {
    insulinType?: string | null;
    insulinCode?: string | null;
    insulinCodes?: string[] | null;
    minLevel?: number;
    searchQuery?: string | null;
  }
): AvailabilityEntity[] {
  let filtered = [...data];
  
  if (filters.insulinType) {
    filtered = filterByInsulinType(filtered, filters.insulinType);
  }
  
  if (filters.insulinCodes && filters.insulinCodes.length > 0) {
    filtered = filterByInsulinCodes(filtered, filters.insulinCodes);
  } else if (filters.insulinCode) {
    // Legacy support for single insulin selection
    filtered = filterByInsulinCode(filtered, filters.insulinCode);
  }
  
  if (filters.searchQuery) {
    filtered = filterBySearchQuery(filtered, filters.searchQuery);
  }
  
  if (filters.minLevel && filters.minLevel > 1) {
    filtered = filterByMinimumLevel(filtered, filters.minLevel);
  }
  
  return filtered;
}

/**
 * Enriches availability data with metrics useful for sorting
 */
export function addSortingMetrics(
  data: AvailabilityEntity[],
  selectedInsulinCodes: string[]
): (AvailabilityEntity & { minLevel: number; totalQty: number })[] {
  return data.map(entity => {
    const relevant = entity.quantity.filter(
      q => selectedInsulinCodes.includes(q.insulin.code) && q.quantity > 0
    );
    
    const minLevel = relevant.length > 0 
      ? Math.min(...relevant.map(q => q.level)) 
      : 0;
      
    const totalQty = relevant.reduce(
      (sum, q) => sum + q.quantity, 
      0
    );
    
    return {
      ...entity,
      minLevel,
      totalQty
    };
  });
}