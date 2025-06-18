import { PickupEntity } from "domain/entities/pickup";
import { BusinessHourEntity } from "domain/entities/business-hour";
import { AvailabilityEntity } from "domain/entities/availability";

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
  return {
    id,
    name,
    address: {
      address,
      latitude: 0,
      longitude: 0,
    },
    businessHours,
    availability: availability || [],
  };
}

/**
 * Helper to create a BusinessHourEntity for tests.
 */
export function createBusinessHour(
  dayOfWeek: number,
  open: string,
  close: string,
  isOpen = true,
): BusinessHourEntity {
  return {
    dayOfWeek: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    hours: [open, close],
    isOpen,
  };
}

/**
 * Helper to create an AvailabilityEntity for tests.
 */
export function createAvailability(insulinCode: string): AvailabilityEntity {
  return {
    insulin: {
      name: insulinCode,
      simpleName: insulinCode,
      code: insulinCode,
      type: "AMPOLA",
    },
    quantity: 1,
    level: 1,
  };
}
