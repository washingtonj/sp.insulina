import { type AddressEntity, addDistance } from "./address";
import type { AvailabilityEntity } from "./availability";
import type { BusinessHourEntity } from "./business-hour";

export interface PickupEntity {
  id?: string;
  name: string;
  address: AddressEntity;
  availability: AvailabilityEntity[];
  businessHours: BusinessHourEntity[];
}

/**
 * Extracts a list of unique insulins available across all provided pickups.
 *
 * @param pickups - An array of PickupEntity objects to extract insulins from.
 * @returns An array of unique insulin objects found in the pickups' availability.
 */
export function extractAvailableInsulins(pickups: PickupEntity[]) {
  const insulinSet = new Set<string>();
  const insulins = [];

  for (const pickup of pickups) {
    for (const { insulin } of pickup.availability) {
      const key = insulin.code;
      if (!insulinSet.has(key)) {
        insulinSet.add(key);
        insulins.push(insulin);
      }
    }
  }

  return insulins;
}

/**
 * Calculates the distance from a given location to the pickup's address,
 * and returns a new PickupEntity with the address updated to include distance information.
 *
 * @param pickup - The PickupEntity whose address will be updated with distance.
 * @param location - An object containing latitude and longitude to calculate distance from.
 * @returns A new PickupEntity with the address property updated to include distance.
 */
export function calcPickupDistance(
  pickup: PickupEntity,
  location: { lat: number; lng: number },
): PickupEntity {
  const addressWithDistance = addDistance(pickup.address, location);
  return { ...pickup, address: addressWithDistance };
}

/**
 * Determines if two pickup objects represent the same pickup location,
 * based on their name and address string.
 *
 * @param a - The first pickup object to compare.
 * @param b - The second pickup object to compare.
 * @returns True if both pickups have the same name and address, false otherwise.
 */
export function isSamePickup(
  a: { name: string; address: { address: string } },
  b: { name: string; address: { address: string } },
) {
  return a.name === b.name && a.address.address === b.address.address;
}
