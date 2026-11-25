import type {
  AvailabilitySnapshot,
  InsulinType,
  InsulinVariant,
} from "../../../domain/entities/index.ts";
import { PickupEntity } from "../../../domain/entities/index.ts";
import type { StoredAddress, StoredBusinessHour } from "./schema.ts";

export type StoredInsulin = {
  id: number;
  code: string;
  name: string;
  simpleName: string;
  type: InsulinType;
  variant: InsulinVariant;
};

export type PickupQueryRow = {
  uuid: string;
  name: string;
  address: StoredAddress;
  business_hours: StoredBusinessHour[];
};

export type LatestAvailabilityQueryRow = {
  checked_at: Date;
  data: AvailabilitySnapshot[];
};

export type PickupQueryResult = {
  pickup: PickupQueryRow;
  availability: LatestAvailabilityQueryRow | null;
};

export function transformPickupsQueryResults(
  results: PickupQueryResult[],
  insulinsMap: Map<string, StoredInsulin>,
): PickupEntity[] {
  return results.map(({ pickup, availability }) => {
    return new PickupEntity({
      id: pickup.uuid,
      name: pickup.name,
      address: pickup.address,
      businessHours: pickup.business_hours,
      checkedAt: availability
        ? availability.checked_at.toISOString()
        : undefined,
      availability: (availability?.data ?? []).flatMap((item) => {
        const insulin = insulinsMap.get(item.insulinCode);
        if (!insulin) return [];

        return [{ insulin, quantity: item.quantity, level: item.level }];
      }),
    });
  });
}
