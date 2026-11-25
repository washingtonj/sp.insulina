import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  AvailabilityEntity,
  BusinessHourEntity,
  InsulinEntity,
  PickupEntity,
} from "../../../../domain/entities/index.ts";
import { createTestDatabase, resetDatabase } from "../../../../test/pglite.ts";
import type { Database } from "../../../database.ts";
import { pickupRepositoryWithPostgres } from "../adapter.ts";
import {
  availabilitiesModel,
  insulinsModel,
  lastAvailabilitiesModel,
  pickupsModel,
  type StoredBusinessHour,
} from "../schema.ts";

const insulins = [
  {
    id: 1,
    code: "REFILL-NPH",
    name: "Refill NPH",
    simpleName: "NPH",
    type: "REFILL",
    variant: "NPH",
  },
  {
    id: 2,
    code: "AMP-REG",
    name: "Ampola Regular",
    simpleName: "REGULAR",
    type: "AMPOLA",
    variant: "REGULAR",
  },
] satisfies (typeof insulinsModel.$inferInsert)[];

const businessHours: StoredBusinessHour[] = [
  { dayOfWeek: 1, hours: ["08:00", "18:00"] },
  { dayOfWeek: 2, hours: ["08:00", "18:00"] },
];

const pickups = [
  {
    id: 1,
    uuid: "pickup-1",
    name: "Pickup 1",
    address: {
      address: "Rua Um, 1",
      latitude: -23.5,
      longitude: -46.6,
    },
    business_hours: businessHours,
  },
  {
    id: 2,
    uuid: "pickup-2",
    name: "Pickup 2",
    address: {
      address: "Rua Dois, 2",
      latitude: -23.6,
      longitude: -46.7,
    },
    business_hours: businessHours,
  },
];

function createAvailability(
  code: string,
  quantity: number,
  level: 1 | 2 | 3,
): AvailabilityEntity {
  return new AvailabilityEntity({
    insulin: new InsulinEntity({
      code,
      name: code,
      type: "AMPOLA",
      variant: "NPH",
    }),
    quantity,
    level,
  });
}

function createPickup(quantity: number): PickupEntity {
  return new PickupEntity({
    id: "pickup-1",
    name: "Pickup 1",
    address: pickups[0].address,
    businessHours: [
      new BusinessHourEntity({ dayOfWeek: 1, hours: ["08:00", "18:00"] }),
    ],
    availability: [createAvailability("REFILL-NPH", quantity, 2)],
  });
}

describe("pickupRepositoryWithPostgres", () => {
  let client: PGlite;
  let db: Database;

  beforeAll(async () => {
    ({ client, db } = await createTestDatabase());
  });

  beforeEach(async () => {
    await resetDatabase(client);
    await db.insert(insulinsModel).values(insulins);
    await db.insert(pickupsModel).values(pickups);
  });

  afterAll(async () => {
    await client.close();
  });

  it("reads the latest availability with address, business hours and insulin metadata", async () => {
    await db.insert(lastAvailabilitiesModel).values({
      pickup_id: 1,
      checked_at: new Date("2026-11-24T20:00:00.000Z"),
      data: [
        { insulinCode: "REFILL-NPH", quantity: 7, level: 2 },
        { insulinCode: "AMP-REG", quantity: 0, level: 1 },
      ],
    });

    const result = await pickupRepositoryWithPostgres(db).getAllPickups();

    expect(result).toHaveLength(2);

    const first = result.find((pickup) => pickup.id === "pickup-1")!;
    expect(first.name).toBe("Pickup 1");
    expect(first.address.address).toBe("Rua Um, 1");
    expect(first.address.latitude).toBe(-23.5);
    expect(first.businessHours).toHaveLength(2);
    expect(first.checkedAt).toBe("2026-11-24T20:00:00.000Z");
    expect(first.availability).toHaveLength(2);
    expect(first.availability[0].insulin).toEqual(insulins[0]);
    expect(first.availability[0].quantity).toBe(7);
    expect(first.availability[0].level).toBe(2);
    expect(first.availability[1].quantity).toBe(0);
    expect(first.availability[1].level).toBe(1);

    const second = result.find((pickup) => pickup.id === "pickup-2")!;
    expect(second.availability).toEqual([]);
    expect(second.checkedAt).toBeUndefined();
  });

  it("counts the last reading of each São Paulo day per insulin type and variant", async () => {
    await db.insert(availabilitiesModel).values([
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-23T12:00:00.000Z"),
        data: [
          { insulinCode: "REFILL-NPH", quantity: 10, level: 2 },
          { insulinCode: "AMP-REG", quantity: 0, level: 1 },
        ],
      },
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-23T20:00:00.000Z"),
        data: [
          { insulinCode: "REFILL-NPH", quantity: 5, level: 2 },
          { insulinCode: "AMP-REG", quantity: 2, level: 2 },
        ],
      },
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-24T02:30:00.000Z"),
        data: [
          { insulinCode: "REFILL-NPH", quantity: 7, level: 2 },
          { insulinCode: "AMP-REG", quantity: 0, level: 1 },
        ],
      },
      {
        pickup_id: 2,
        checked_at: new Date("2026-11-23T13:00:00.000Z"),
        data: [
          { insulinCode: "REFILL-NPH", quantity: 0, level: 1 },
          { insulinCode: "AMP-REG", quantity: 3, level: 2 },
        ],
      },
      {
        pickup_id: 2,
        checked_at: new Date("2026-11-24T03:00:00.000Z"),
        data: [
          { insulinCode: "REFILL-NPH", quantity: 4, level: 2 },
          { insulinCode: "AMP-REG", quantity: 1, level: 1 },
        ],
      },
    ]);

    const rows = await pickupRepositoryWithPostgres(db).getAvailabilitySeries({
      startDate: new Date("2026-11-23T03:00:00.000Z"),
      endDate: new Date("2026-11-25T02:59:59.999Z"),
    });

    expect(rows).toEqual([
      {
        day: "2026-11-23",
        type: "AMPOLA",
        variant: "REGULAR",
        pickupsWithStock: 1,
        totalQuantity: 3,
        pickupsReported: 2,
      },
      {
        day: "2026-11-23",
        type: "REFILL",
        variant: "NPH",
        pickupsWithStock: 1,
        totalQuantity: 7,
        pickupsReported: 2,
      },
      {
        day: "2026-11-24",
        type: "AMPOLA",
        variant: "REGULAR",
        pickupsWithStock: 1,
        totalQuantity: 1,
        pickupsReported: 1,
      },
      {
        day: "2026-11-24",
        type: "REFILL",
        variant: "NPH",
        pickupsWithStock: 1,
        totalQuantity: 4,
        pickupsReported: 1,
      },
    ]);
  });

  it("filters the series by pickup uuid", async () => {
    await db.insert(availabilitiesModel).values([
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-24T12:00:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 10, level: 2 }],
      },
      {
        pickup_id: 2,
        checked_at: new Date("2026-11-24T12:00:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 4, level: 2 }],
      },
    ]);

    const rows = await pickupRepositoryWithPostgres(db).getAvailabilitySeries({
      startDate: new Date("2026-11-24T03:00:00.000Z"),
      endDate: new Date("2026-11-25T02:59:59.999Z"),
      pickupId: "pickup-2",
    });

    expect(rows).toEqual([
      {
        day: "2026-11-24",
        type: "REFILL",
        variant: "NPH",
        pickupsWithStock: 1,
        totalQuantity: 4,
        pickupsReported: 1,
      },
    ]);
  });

  it("picks the best day by the unrounded average", async () => {
    const months = ["06", "07", "08", "09", "10"];
    const reading = (month: string, day: number, quantity: number) => ({
      pickup_id: 1,
      checked_at: new Date(`2026-${month}-${day}T15:00:00.000Z`),
      data: [{ insulinCode: "REFILL-NPH", quantity, level: 2 as const }],
    });

    await db.insert(availabilitiesModel).values([
      ...months.map((month, index) => reading(month, 10, index === 4 ? 6 : 5)),
      ...months.map((month, index) => reading(month, 20, index === 4 ? 7 : 5)),
    ]);

    const rows = await pickupRepositoryWithPostgres(db).getBestDayProfile({
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      endDate: new Date("2026-10-31T00:00:00.000Z"),
    });

    expect(rows).toEqual([
      { uuid: "pickup-1", dayOfMonth: 20, averageUnits: 5, samples: 5 },
    ]);
  });

  it("maps availabilities by pickup uuid and ISO checked_at", async () => {
    await db.insert(availabilitiesModel).values([
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-23T12:00:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 10, level: 2 }],
      },
      {
        pickup_id: 2,
        checked_at: new Date("2026-11-24T12:00:00.000Z"),
        data: [{ insulinCode: "AMP-REG", quantity: 3, level: 1 }],
      },
    ]);

    const result = await pickupRepositoryWithPostgres(db).getAvailabilities({
      startDate: new Date("2026-11-23T00:00:00.000Z"),
      endDate: new Date("2026-11-24T23:59:59.999Z"),
    });

    expect(result).toEqual({
      "pickup-1": {
        "2026-11-23T12:00:00.000Z": [
          { insulinCode: "REFILL-NPH", quantity: 10, level: 2 },
        ],
      },
      "pickup-2": {
        "2026-11-24T12:00:00.000Z": [
          { insulinCode: "AMP-REG", quantity: 3, level: 1 },
        ],
      },
    });
  });

  it("adds pickups with a generated uuid and jsonb columns", async () => {
    await resetDatabase(client);

    const pickup = new PickupEntity({
      name: "Novo Posto",
      address: { address: "Rua Nova, 10", latitude: -23.1, longitude: -46.2 },
      businessHours: [
        new BusinessHourEntity({ dayOfWeek: 3, hours: ["09:00", "17:00"] }),
      ],
      availability: [],
    });

    await pickupRepositoryWithPostgres(db).addPickups([pickup]);

    const rows = await db.select().from(pickupsModel);
    expect(rows).toHaveLength(1);
    expect(rows[0].uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(rows[0].name).toBe("Novo Posto");
    expect(rows[0].address).toEqual({
      address: "Rua Nova, 10",
      latitude: -23.1,
      longitude: -46.2,
    });
    expect(rows[0].business_hours).toEqual([
      { dayOfWeek: 3, hours: ["09:00", "17:00"] },
    ]);
  });

  it("upserts availabilities and the latest availability", async () => {
    const repository = pickupRepositoryWithPostgres(db);

    await repository.updateAvailabilities([createPickup(9)]);

    const firstRun = await db.select().from(availabilitiesModel);
    expect(firstRun).toHaveLength(1);
    expect(firstRun[0].data).toEqual([
      { insulinCode: "REFILL-NPH", quantity: 9, level: 2 },
    ]);

    await repository.updateAvailabilities([createPickup(2)]);

    const secondRun = await db.select().from(availabilitiesModel);
    expect(secondRun).toHaveLength(2);

    const latest = await db.select().from(lastAvailabilitiesModel);
    expect(latest).toHaveLength(1);
    expect(latest[0].data).toEqual([
      { insulinCode: "REFILL-NPH", quantity: 2, level: 2 },
    ]);
  });

  it("updates the availability row when checked_at is the same instant", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-24T20:00:00.000Z"));

    try {
      const repository = pickupRepositoryWithPostgres(db);

      await repository.updateAvailabilities([createPickup(9)]);
      await repository.updateAvailabilities([createPickup(2)]);

      const rows = await db.select().from(availabilitiesModel);
      expect(rows).toHaveLength(1);
      expect(rows[0].data).toEqual([
        { insulinCode: "REFILL-NPH", quantity: 2, level: 2 },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });
});
