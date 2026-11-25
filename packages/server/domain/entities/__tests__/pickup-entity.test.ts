import { describe, expect, it } from "vitest";
import type { DayOfWeek } from "../business-hour-entity";
import { PickupEntity } from "../pickup-entity";

function pickupWith(hours: [string, string], days: DayOfWeek[]) {
  return new PickupEntity({
    name: "Unidade",
    address: { address: "Rua Um, 1", latitude: -23.5, longitude: -46.6 },
    availability: [],
    businessHours: days.map((dayOfWeek) => ({ dayOfWeek, hours })),
  });
}

describe("isWeekendOpen", () => {
  it("does not count a 00:00–00:00 weekend as open", () => {
    expect(pickupWith(["00:00", "00:00"], [0, 6]).isWeekendOpen()).toBe(false);
  });

  it("counts a full-day weekend as open", () => {
    expect(pickupWith(["00:00", "23:59"], [0, 6]).isWeekendOpen()).toBe(true);
  });

  it("ignores weekday hours", () => {
    expect(pickupWith(["08:00", "18:00"], [1, 2, 3]).isWeekendOpen()).toBe(
      false,
    );
  });

  it("counts an open Saturday", () => {
    expect(pickupWith(["08:00", "12:00"], [6]).isWeekendOpen()).toBe(true);
  });
});
