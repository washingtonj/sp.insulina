import { describe, it, expect } from "vitest";
import { transformBusinessHours } from "../transform-business-hours";
import type { BusinessHourEntity } from "domain/entities";

function getOpenDays(businessHours: BusinessHourEntity[]) {
  return businessHours
    .filter((d) => d.hours[0] !== "00:00" || d.hours[1] !== "00:00")
    .map((d) => d.dayOfWeek);
}

describe("transformBusinessHours", () => {
  it("parses weekday range with full names", () => {
    const input = "De Segunda a Sexta: 07:00 até 19:00.";
    const result = transformBusinessHours(input);
    expect(getOpenDays(result)).toEqual([1, 2, 3, 4, 5]);
    for (let i = 1; i <= 5; i++) {
      expect(result[i].hours).toEqual(["07:00", "19:00"]);
    }
    expect(result[0].hours).toEqual(["00:00", "00:00"]);
    expect(result[6].hours).toEqual(["00:00", "00:00"]);
  });

  it("parses weekday + Saturday with full names", () => {
    const input =
      "De Segunda a Sexta: 07:00 até 19:00. | Sábado: 08:00 até 12:00.";
    const result = transformBusinessHours(input);
    expect(getOpenDays(result)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result[6].hours).toEqual(["08:00", "12:00"]);
  });

  it("parses all days 24h with full names", () => {
    const input = "De Segunda a Domingo: 00:00 até 23:59.";
    const result = transformBusinessHours(input);
    expect(getOpenDays(result)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (let i = 0; i < 7; i++) {
      expect(result[i].hours).toEqual(["00:00", "23:59"]);
    }
  });

  it("parses separate Sunday with full names", () => {
    const input =
      "De Segunda a Sexta: 07:00 até 19:00. | Domingo: 09:00 até 13:00.";
    const result = transformBusinessHours(input);
    expect(getOpenDays(result)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(result[0].hours).toEqual(["09:00", "13:00"]);
  });

  it("parses single day with full name", () => {
    const input = "Sábado: 08:00 até 12:00.";
    const result = transformBusinessHours(input);
    expect(getOpenDays(result)).toEqual([6]);
    expect(result[6].hours).toEqual(["08:00", "12:00"]);
  });

  it("parses weekday and weekend with full names", () => {
    const input =
      "De Segunda a Sexta: 00:00 até 23:59. | Sábado: 00:00 até 23:59. | Domingo: 00:00 até 23:59.";
    const result = transformBusinessHours(input);
    expect(getOpenDays(result)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (let i = 0; i < 7; i++) {
      expect(result[i].hours).toEqual(["00:00", "23:59"]);
    }
  });

  it("returns all closed for empty input", () => {
    const result = transformBusinessHours("");
    expect(getOpenDays(result)).toEqual([]);
    for (let i = 0; i < 7; i++) {
      expect(result[i].hours).toEqual(["00:00", "00:00"]);
    }
  });

  it("ignores malformed input", () => {
    const input = "FooBar: 10:00 até 11:00.";
    const result = transformBusinessHours(input);
    expect(getOpenDays(result)).toEqual([]);
  });
});
