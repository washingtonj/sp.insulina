import {
  PickupEntity,
  BusinessHourEntity,
  AvailabilityEntity,
} from "domain/entities";

/**
 * Helper to create a PickupEntity for tests.
 */
export function createPickup({
  name,
  address,
  businessHours,
  availability,
  id,
}: {
  name: string;
  address: string;
  businessHours: BusinessHourEntity[];
  availability?: AvailabilityEntity[];
  id?: string;
}): PickupEntity {
  return new PickupEntity({
    id,
    name,
    address: {
      address,
      latitude: 0,
      longitude: 0,
    },
    businessHours,
    availability: availability || [],
  });
}

/**
 * Helper to create a BusinessHourEntity for tests.
 */
export function createBusinessHour(
  dayOfWeek: number,
  open: string,
  close: string,
): BusinessHourEntity {
  return new BusinessHourEntity({
    dayOfWeek: dayOfWeek as BusinessHourEntity["dayOfWeek"],
    hours: [open, close],
  });
}

/**
 * Helper to create an AvailabilityEntity for tests.
 */
export function createAvailability(insulinCode: string): AvailabilityEntity {
  return new AvailabilityEntity({
    insulin: {
      name: insulinCode,
      code: insulinCode,
      availableIn: "AMPOLA",
      variant: "NPH",
    },
    quantity: 1,
    level: 1,
  });
}
