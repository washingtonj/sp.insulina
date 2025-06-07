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

export function calcPickupDistance(
  pickup: PickupEntity,
  location: { lat: number; lng: number },
): PickupEntity {
  const addressWithDistance = addDistance(pickup.address, location);
  return { ...pickup, address: addressWithDistance };
}
