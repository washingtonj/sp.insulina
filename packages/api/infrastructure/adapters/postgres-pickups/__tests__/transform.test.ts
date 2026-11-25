import { describe, expect, it } from "vitest";
import { PickupEntity } from "../../../../domain/entities/index.ts";
import { transformPickupsQueryResults, type StoredInsulin } from "../transform.ts";

const sampleInsulins = [
  {
    id: 1,
    code: "NPH-AMP",
    name: "NPH Ampola",
    simpleName: "NPH",
    type: "AMPOLA",
    variant: "NPH",
  },
  {
    id: 2,
    code: "REG-CAN",
    name: "Regular Caneta",
    simpleName: "Regular",
    type: "CANETA",
    variant: "REGULAR",
  },
] satisfies StoredInsulin[];

const insulinsMap = new Map(
  sampleInsulins.map((insulin) => [insulin.code, insulin]),
);

describe("transformPickupsQueryResults", () => {
  it("transforms a pickup with address, business hours and enriched availabilities", () => {
    const pickups = transformPickupsQueryResults(
      [
        {
          pickup: {
            uuid: "pickup-1",
            name: "Posto Central",
            address: {
              address: "Rua Principal, 123",
              latitude: -23.5,
              longitude: -46.6,
            },
            business_hours: [
              { dayOfWeek: 1, hours: ["08:00", "17:00"] },
              { dayOfWeek: 2, hours: ["08:00", "17:00"] },
            ],
          },
          availability: {
            checked_at: new Date("2024-06-01T12:00:00Z"),
            data: [
              { insulinCode: "NPH-AMP", quantity: 10, level: 3 },
              { insulinCode: "REG-CAN", quantity: 5, level: 2 },
            ],
          },
        },
      ],
      insulinsMap,
    );

    expect(pickups).toHaveLength(1);
    const pickup = pickups[0];
    expect(pickup).toBeInstanceOf(PickupEntity);
    expect(pickup.id).toBe("pickup-1");
    expect(pickup.name).toBe("Posto Central");
    expect(pickup.address.address).toBe("Rua Principal, 123");
    expect(pickup.address.latitude).toBe(-23.5);
    expect(pickup.address.longitude).toBe(-46.6);
    expect(pickup.businessHours).toEqual([
      { dayOfWeek: 1, hours: ["08:00", "17:00"] },
      { dayOfWeek: 2, hours: ["08:00", "17:00"] },
    ]);
    expect(pickup.availability).toHaveLength(2);
    expect(pickup.availability[0].insulin).toEqual(sampleInsulins[0]);
    expect(pickup.availability[0].quantity).toBe(10);
    expect(pickup.availability[0].level).toBe(3);
    expect(pickup.availability[1].insulin).toEqual(sampleInsulins[1]);
    expect(pickup.availability[1].quantity).toBe(5);
    expect(pickup.availability[1].level).toBe(2);
    expect(pickup.checkedAt).toBe("2024-06-01T12:00:00.000Z");
  });

  it("drops readings whose insulin metadata is missing", () => {
    const pickups = transformPickupsQueryResults(
      [
        {
          pickup: {
            uuid: "pickup-2",
            name: "Posto Secundário",
            address: {
              address: "Rua Secundária, 456",
              latitude: -23.6,
              longitude: -46.7,
            },
            business_hours: [{ dayOfWeek: 3, hours: ["09:00", "18:00"] }],
          },
          availability: {
            checked_at: new Date("2024-06-02T12:00:00Z"),
            data: [
              { insulinCode: "UNKNOWN", quantity: 2, level: 1 },
              { insulinCode: "NPH-AMP", quantity: 4, level: 2 },
            ],
          },
        },
      ],
      insulinsMap,
    );

    expect(pickups[0].availability).toHaveLength(1);
    expect(pickups[0].availability[0].insulin).toEqual(sampleInsulins[0]);
    expect(pickups[0].availability[0].quantity).toBe(4);
  });

  it("maps a pickup without readings to an empty snapshot", () => {
    const pickups = transformPickupsQueryResults(
      [
        {
          pickup: {
            uuid: "pickup-3",
            name: "Posto Sem Leitura",
            address: {
              address: "Rua Vazia, 0",
              latitude: -23.8,
              longitude: -46.9,
            },
            business_hours: [],
          },
          availability: null,
        },
      ],
      insulinsMap,
    );

    expect(pickups[0].availability).toEqual([]);
    expect(pickups[0].checkedAt).toBeUndefined();
  });
});
