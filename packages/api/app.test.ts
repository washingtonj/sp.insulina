import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createApp } from "./app.ts";
import { createTestDatabase, resetDatabase } from "./test/pglite.ts";
import type { Database } from "./infrastructure/database.ts";
import {
  availabilitiesModel,
  insulinsModel,
  lastAvailabilitiesModel,
  pickupsModel,
  type StoredBusinessHour,
} from "./infrastructure/adapters/postgres-pickups/schema.ts";

const businessHours: StoredBusinessHour[] = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek: dayOfWeek as StoredBusinessHour["dayOfWeek"],
  hours: ["08:00", "18:00"],
}));

const pickup = {
  id: 1,
  uuid: "pickup-1",
  name: "Pickup 1",
  address: { address: "Rua Um, 1", latitude: -23.5, longitude: -46.6 },
  business_hours: businessHours,
};

const otherPickup = {
  id: 2,
  uuid: "pickup-2",
  name: "Pickup 2",
  address: { address: "Rua Dois, 2", latitude: -23.6, longitude: -46.7 },
  business_hours: businessHours,
};

const dayKey = (date: Date) =>
  new Date(date.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

describe("api contract", () => {
  let client: PGlite;
  let db: Database;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    ({ client, db } = await createTestDatabase());
    app = createApp(db);
  });

  beforeEach(async () => {
    vi.setSystemTime(new Date("2026-11-24T15:00:00.000Z"));
    await resetDatabase(client);
    await db.insert(insulinsModel).values([
      {
        id: 1,
        code: "REFILL-NPH",
        name: "Refill NPH",
        simpleName: "NPH",
        type: "REFILL",
        variant: "NPH",
      },
    ]);
    await db.insert(pickupsModel).values([pickup, otherPickup]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  afterAll(async () => {
    await client.close();
  });

  it("serves pickups as DTOs with CORS enabled", async () => {
    await db.insert(lastAvailabilitiesModel).values({
      pickup_id: 1,
      checked_at: new Date("2026-11-24T20:00:00.000Z"),
      data: [{ insulinCode: "REFILL-NPH", quantity: 7, level: 2 }],
    });

    const response = await app.request("/", {
      headers: { Origin: "http://example.com" },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");

    const body = (await response.json()) as any[];
    expect(body).toHaveLength(2);

    const first = body.find((item) => item.id === "pickup-1");
    expect(first).toMatchObject({
      id: "pickup-1",
      name: "Pickup 1",
      address: {
        address: "Rua Um, 1",
        latitude: -23.5,
        longitude: -46.6,
      },
      businessHourTags: ["Seg a Sex das 08:00 às 18:00"],
      is24HoursOpen: false,
      isWeekendOpen: false,
      checkedAt: "2026-11-24T20:00:00.000Z",
      availability: [
        {
          insulin: {
            code: "REFILL-NPH",
            name: "Refill NPH",
            simpleName: "NPH",
            type: "REFILL",
            variant: "NPH",
          },
          quantity: 7,
          level: 2,
        },
      ],
    });
  });

  it("serves the last seven days of availabilities keyed by pickup uuid", async () => {
    const checkedAt = new Date();
    await db.insert(availabilitiesModel).values({
      pickup_id: 1,
      checked_at: checkedAt,
      data: [{ insulinCode: "REFILL-NPH", quantity: 7, level: 2 }],
    });

    const response = await app.request("/availabilities");
    const body = (await response.json()) as Record<string, Record<string, unknown>>;

    expect(response.status).toBe(200);
    expect(Object.keys(body)).toEqual(["pickup-1"]);
    expect(body["pickup-1"][checkedAt.toISOString()]).toEqual([
      { insulinCode: "REFILL-NPH", quantity: 7, level: 2 },
    ]);
  });

  it("serves the availability series with the frozen payload shape", async () => {
    const now = new Date();
    await db.insert(availabilitiesModel).values([
      {
        pickup_id: 1,
        checked_at: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        data: [{ insulinCode: "REFILL-NPH", quantity: 2, level: 1 }],
      },
      {
        pickup_id: 1,
        checked_at: now,
        data: [{ insulinCode: "REFILL-NPH", quantity: 6, level: 2 }],
      },
    ]);

    const response = await app.request("/availabilities/series?days=2");
    const body = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(body.days).toHaveLength(2);
    expect(body.days[1]).toBe(dayKey(now));
    expect(body.series).toEqual([
      {
        type: "REFILL",
        variant: "NPH",
        points: [
          {
            day: body.days[0],
            pickupsWithStock: 1,
            totalQuantity: 2,
            pickupsReported: 1,
          },
          {
            day: body.days[1],
            pickupsWithStock: 1,
            totalQuantity: 6,
            pickupsReported: 1,
          },
        ],
      },
    ]);
  });

  it("scopes the series to the pickup uuid", async () => {
    const now = new Date();
    await db.insert(availabilitiesModel).values([
      {
        pickup_id: 1,
        checked_at: now,
        data: [{ insulinCode: "REFILL-NPH", quantity: 6, level: 2 }],
      },
      {
        pickup_id: 2,
        checked_at: now,
        data: [{ insulinCode: "REFILL-NPH", quantity: 4, level: 2 }],
      },
    ]);

    const response = await app.request("/pickups/pickup-2/availabilities?days=1");
    const body = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(body.days).toEqual([dayKey(now)]);
    expect(body.series[0].points[0]).toEqual({
      day: dayKey(now),
      pickupsWithStock: 1,
      totalQuantity: 4,
      pickupsReported: 1,
    });
  });

  it("serves the best day of month per pickup", async () => {
    await db.insert(availabilitiesModel).values([
      {
        pickup_id: 1,
        checked_at: new Date("2026-10-22T15:00:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 10, level: 2 }],
      },
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-10T15:00:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 2, level: 1 }],
      },
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-22T15:00:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 30, level: 2 }],
      },
    ]);

    const response = await app.request("/pickups/best-days?days=90");
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      "pickup-1": { dayOfMonth: 22, averageUnits: 20, samples: 2 },
    });
  });

  it("uses the São Paulo day and ignores discontinued formats", async () => {
    await db.insert(insulinsModel).values({
      id: 2,
      code: "CANETA-REG",
      name: "Caneta Regular",
      simpleName: "Regular",
      type: "CANETA",
      variant: "REGULAR",
    });
    await db.insert(availabilitiesModel).values([
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-24T02:30:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 4, level: 1 }],
      },
      {
        pickup_id: 2,
        checked_at: new Date("2026-11-24T15:00:00.000Z"),
        data: [{ insulinCode: "CANETA-REG", quantity: 100, level: 3 }],
      },
    ]);

    const response = await app.request("/pickups/best-days?days=90");
    const body = (await response.json()) as Record<string, unknown>;

    expect(body).toEqual({
      "pickup-1": { dayOfMonth: 23, averageUnits: 4, samples: 1 },
    });
  });

  it("takes the last reading of each São Paulo day", async () => {
    await db.insert(availabilitiesModel).values([
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-10T12:00:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 10, level: 2 }],
      },
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-10T20:00:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 30, level: 2 }],
      },
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-20T15:00:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 35, level: 2 }],
      },
    ]);

    const response = await app.request("/pickups/best-days?days=90");
    const body = (await response.json()) as Record<string, unknown>;

    expect(body).toEqual({
      "pickup-1": { dayOfMonth: 20, averageUnits: 35, samples: 1 },
    });
  });

  it("breaks best-day ties by the lowest day of the month", async () => {
    await db.insert(availabilitiesModel).values([
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-10T15:00:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 10, level: 2 }],
      },
      {
        pickup_id: 1,
        checked_at: new Date("2026-11-20T15:00:00.000Z"),
        data: [{ insulinCode: "REFILL-NPH", quantity: 10, level: 2 }],
      },
    ]);

    const response = await app.request("/pickups/best-days?days=90");
    const body = (await response.json()) as Record<
      string,
      { dayOfMonth: number }
    >;

    expect(body["pickup-1"].dayOfMonth).toBe(10);
  });

  it("rejects days outside 1..90", async () => {
    for (const days of ["0", "91", "1.5", "abc"]) {
      const response = await app.request(`/availabilities/series?days=${days}`);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "days deve ser um inteiro entre 1 e 90",
      });
    }
  });
});
