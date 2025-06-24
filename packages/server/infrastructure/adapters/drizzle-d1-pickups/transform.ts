import { PickupEntity } from "domain/entities";

/**
 * Transforms the raw rows from the getAllPickups query
 * into an array of PickupEntity instances.
 *
 * @param results - The pickups query results (with merged address/businessHours JSON)
 * @param insulinsMap - Map of insulin code to insulin entity for enrichment
 */
export function transformPickupsQueryResults(
  results: any[],
  insulinsMap: Map<string, any>,
): PickupEntity[] {
  return results.map(({ pickup, availability }) => {
    // Parse address and businessHours from JSON columns
    let address = { address: "", latitude: 0, longitude: 0 };
    let businessHours: any[] = [];
    try {
      address =
        typeof pickup.address === "string"
          ? JSON.parse(pickup.address)
          : pickup.address;
    } catch {}
    try {
      businessHours =
        typeof pickup.business_hours === "string"
          ? JSON.parse(pickup.business_hours)
          : pickup.business_hours;
    } catch {}

    // Parse and flatten availabilities
    let flatAvailabilities: any[] = [];
    if (availability && availability.data && availability.checked_at) {
      try {
        const parsed = JSON.parse(availability.data);
        if (Array.isArray(parsed)) {
          flatAvailabilities = parsed.map((item: any) => ({
            ...item,
            checked_at: availability.checked_at,
          }));
        }
      } catch {
        // skip invalid JSON
      }
    }

    return new PickupEntity({
      id: pickup.uuid,
      name: pickup.name,
      address,
      businessHours,
      availability: flatAvailabilities.map((a) => ({
        insulin: insulinsMap.get(a.insulinCode) ?? { code: a.insulinCode },
        quantity: a.quantity,
        level: a.level,
      })),
    });
  });
}
