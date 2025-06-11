import { PickupEntity } from "domain/entities/pickup";

/**
 * Transforms the raw joined rows from the getAllPickups query
 * into an array of PickupEntity instances.
 *
 * @param results - The joined query results
 * @param insulinMap - Map of insulin code to insulin entity for enrichment
 */
export function transformPickupsQueryResults(
  results: any[],
  insulinMap: Map<string, { code: string; name: string; simpleName: string; type: string }>
): PickupEntity[] {
  return results.map(({ pickup, address, businessHour, availability }) => {
    // Always treat businessHour as array for simplicity
    const businessHoursArr = Array.isArray(businessHour)
      ? businessHour
      : businessHour
      ? [businessHour]
      : [];
    const businessHours = businessHoursArr
      .filter(
        (bh) =>
          bh &&
          typeof bh.day_of_week === "number" &&
          typeof bh.open_time === "string" &&
          typeof bh.close_time === "string"
      )
      .map((bh) => ({
        dayOfWeek: bh.day_of_week,
        hours: [bh.open_time, bh.close_time],
      }));

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

    return {
      id: pickup.uuid,
      name: pickup.name,
      address: {
        latitude: address.lat,
        longitude: address.lng,
        address: address.street,
      },
      businessHours,
      availability: flatAvailabilities.map((a) => ({
        insulin: insulinMap.get(a.insulinCode),
        quantity: a.quantity,
        level: a.level,
      })),
    } as PickupEntity;
  });
}
