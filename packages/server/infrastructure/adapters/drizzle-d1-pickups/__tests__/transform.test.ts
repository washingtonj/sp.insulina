import { transformPickupsQueryResults } from "../transform";
import { PickupEntity } from "domain/entities";
import { describe, it, expect } from "vitest";

const sampleInsulins = [
  {
    code: "NPH-AMP",
    name: "NPH Ampola",
    simpleName: "NPH",
    type: "AMPOLA",
    variant: "NPH",
  },
  {
    code: "REG-CAN",
    name: "Regular Caneta",
    simpleName: "Regular",
    type: "CANETA",
    variant: "REGULAR",
  },
];

const insulinsMap = new Map(sampleInsulins.map((i) => [i.code, i]));

describe("transformPickupsQueryResults", () => {
  it("should transform a pickup with address, business hours, and enriched insulin availabilities", () => {
    const pickupRow = {
      pickup: {
        uuid: "pickup-1",
        name: "Posto Central",
        address: JSON.stringify({
          address: "Rua Principal, 123",
          latitude: -23.5,
          longitude: -46.6,
        }),
        business_hours: JSON.stringify([
          { dayOfWeek: 1, hours: ["08:00", "17:00"] },
          { dayOfWeek: 2, hours: ["08:00", "17:00"] },
        ]),
      },
      availability: {
        checked_at: "2024-06-01T12:00:00Z",
        data: JSON.stringify([
          { insulinCode: "NPH-AMP", quantity: 10, level: 3 },
          { insulinCode: "REG-CAN", quantity: 5, level: 2 },
        ]),
      },
    };

    const pickups = transformPickupsQueryResults([pickupRow], insulinsMap);

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

    // Check insulin enrichment
    expect(pickup.availability[0].insulin).toEqual(sampleInsulins[0]);
    expect(pickup.availability[0].quantity).toBe(10);
    expect(pickup.availability[0].level).toBe(3);

    expect(pickup.availability[1].insulin).toEqual(sampleInsulins[1]);
    expect(pickup.availability[1].quantity).toBe(5);
    expect(pickup.availability[1].level).toBe(2);
  });

  it("should handle missing insulin metadata gracefully", () => {
    const pickupRow = {
      pickup: {
        uuid: "pickup-2",
        name: "Posto Secundário",
        address: JSON.stringify({
          address: "Rua Secundária, 456",
          latitude: -23.6,
          longitude: -46.7,
        }),
        business_hours: JSON.stringify([
          { dayOfWeek: 3, hours: ["09:00", "18:00"] },
        ]),
      },
      availability: {
        checked_at: "2024-06-02T12:00:00Z",
        data: JSON.stringify([
          { insulinCode: "UNKNOWN", quantity: 2, level: 1 },
        ]),
      },
    };

    const pickups = transformPickupsQueryResults([pickupRow], insulinsMap);

    expect(pickups).toHaveLength(1);
    const pickup = pickups[0];
    expect(pickup.availability).toHaveLength(1);
    expect(pickup.availability[0].insulin).toEqual({ code: "UNKNOWN" });
    expect(pickup.availability[0].quantity).toBe(2);
    expect(pickup.availability[0].level).toBe(1);
  });

  it("should handle missing or malformed JSON gracefully", () => {
    const pickupRow = {
      pickup: {
        uuid: "pickup-3",
        name: "Posto Malformado",
        address: "{malformed-json}",
        business_hours: "[malformed-json]",
      },
      availability: {
        checked_at: "2024-06-03T12:00:00Z",
        data: "[malformed-json]",
      },
    };

    const pickups = transformPickupsQueryResults([pickupRow], insulinsMap);

    expect(pickups).toHaveLength(1);
    const pickup = pickups[0];
    expect(pickup.address).toBeDefined();
    expect(Array.isArray(pickup.businessHours)).toBe(true);
    expect(Array.isArray(pickup.availability)).toBe(true);
  });
});
