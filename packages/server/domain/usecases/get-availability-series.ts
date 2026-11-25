import type { PickupRepository } from "domain/interfaces/pickup-repository";

const DAY_MS = 24 * 60 * 60 * 1000;
const SAO_PAULO_OFFSET_MS = 3 * 60 * 60 * 1000;

export type AvailabilitySeriesPoint = {
  day: string;
  pickupsWithStock: number;
  totalQuantity: number;
  pickupsReported: number;
};

export type AvailabilitySeries = {
  days: string[];
  series: {
    type: string;
    variant: string;
    points: AvailabilitySeriesPoint[];
  }[];
};

type Adapters = {
  pickupRepository: PickupRepository;
};

type Args = {
  days: number;
  pickupId?: string;
  now?: Date;
};

export function spDayKey(date: Date): string {
  return new Date(date.getTime() - SAO_PAULO_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

function dayKeys(now: Date, days: number): string[] {
  const today = now.getTime();

  return Array.from({ length: days }, (_, index) =>
    spDayKey(new Date(today - (days - 1 - index) * DAY_MS)),
  );
}

export function startOfDay(day: string): Date {
  return new Date(`${day}T00:00:00.000-03:00`);
}

/**
 * One point per calendar day in São Paulo: the last reading of each pickup
 * within that day, so a closed pickup does not read as an availability drop.
 */
export async function getAvailabilitySeries(
  { pickupRepository }: Adapters,
  { days, pickupId, now = new Date() }: Args,
): Promise<AvailabilitySeries> {
  const days_ = dayKeys(now, days);
  const startDate = startOfDay(days_[0]);
  const endDate = new Date(
    startOfDay(days_[days_.length - 1]).getTime() + DAY_MS - 1,
  );

  const rows = await pickupRepository.getAvailabilitySeries({
    startDate,
    endDate,
    pickupId,
  });

  const bySeries = new Map<string, AvailabilitySeries["series"][number]>();

  for (const row of rows) {
    const key = `${row.type}:${row.variant}`;
    const entry = bySeries.get(key) ?? {
      type: row.type,
      variant: row.variant,
      points: [],
    };

    entry.points.push({
      day: row.day,
      pickupsWithStock: Number(row.pickupsWithStock),
      totalQuantity: Number(row.totalQuantity),
      pickupsReported: Number(row.pickupsReported),
    });

    bySeries.set(key, entry);
  }

  return { days: days_, series: [...bySeries.values()] };
}
