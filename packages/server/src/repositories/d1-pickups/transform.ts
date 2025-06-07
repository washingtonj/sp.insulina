import { PickupEntity } from "@sp-insulina/core/entities/pickup";

/**
 * Transforms the raw joined rows from the getAllPickups query
 * into an array of PickupEntity instances.
 */
export function transformPickupsQueryResults(results: any[]): PickupEntity[] {
  const pickupsMap = new Map<
    string,
    {
      pickup: any;
      address: any;
      businessHours: any[];
      availabilities: any[];
    }
  >();

  for (const row of results) {
    const { pickup, address, businessHour, availability, insulin } = row;
    if (!pickupsMap.has(pickup.uuid)) {
      pickupsMap.set(pickup.uuid, {
        pickup,
        address,
        businessHours: [],
        availabilities: [],
      });
    }
    const entry = pickupsMap.get(pickup.uuid)!;

    // Collect business hours
    if (
      businessHour &&
      !entry.businessHours.some(
        (bh) =>
          bh.day_of_week === businessHour.day_of_week &&
          bh.open_time === businessHour.open_time &&
          bh.close_time === businessHour.close_time,
      )
    ) {
      entry.businessHours.push(businessHour);
    }

    // Collect availabilities
    if (
      availability &&
      insulin &&
      !entry.availabilities.some(
        (a) =>
          a.insulin_id === availability.insulin_id &&
          a.pickup_id === availability.pickup_id,
      )
    ) {
      entry.availabilities.push({
        ...availability,
        insulin,
      });
    }
  }

  return Array.from(pickupsMap.values()).map(
    ({ pickup, address, businessHours, availabilities }) =>
      ({
        id: pickup.uuid,
        name: pickup.name,
        address: {
          latitude: address.lat,
          longitude: address.lng,
          address: address.street,
        },
        businessHours: businessHours.map((bh) => ({
          dayOfWeek: bh.day_of_week,
          hours: [bh.open_time, bh.close_time],
        })),
        availability: availabilities.map((a) => ({
          insulin: {
            code: a.insulin.code,
            name: a.insulin.name,
            simpleName: a.insulin.simpleName,
            type: a.insulin.type,
          },
          quantity: a.quantity,
          level: a.availabilityLevel,
        })),
      }) as PickupEntity,
  );
}
