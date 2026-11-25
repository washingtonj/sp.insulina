import { describe, expect, it, vi } from "vitest";
import { getAvailabilitySeries } from "../get-availability-series";

function repositoryReturning(rows: unknown[] = []) {
  return {
    getAvailabilitySeries: vi.fn().mockResolvedValue(rows),
  } as any;
}

describe("getAvailabilitySeries", () => {
  it("lists the days ending today in São Paulo", async () => {
    const now = new Date("2026-11-24T15:00:00Z");

    const result = await getAvailabilitySeries(
      { pickupRepository: repositoryReturning() },
      { days: 3, now },
    );

    expect(result.days).toEqual(["2026-11-22", "2026-11-23", "2026-11-24"]);
  });

  it("keeps today inside the window just after midnight in São Paulo", async () => {
    const now = new Date("2026-11-24T03:01:00Z");

    const result = await getAvailabilitySeries(
      { pickupRepository: repositoryReturning() },
      { days: 2, now },
    );

    expect(result.days).toEqual(["2026-11-23", "2026-11-24"]);
  });

  it("still reports yesterday one minute before midnight in São Paulo", async () => {
    const now = new Date("2026-11-24T02:59:00Z");

    const result = await getAvailabilitySeries(
      { pickupRepository: repositoryReturning() },
      { days: 2, now },
    );

    expect(result.days).toEqual(["2026-11-22", "2026-11-23"]);
  });

  it("uses the São Paulo calendar day, not UTC", async () => {
    const now = new Date("2026-11-24T02:30:00Z");

    const result = await getAvailabilitySeries(
      { pickupRepository: repositoryReturning() },
      { days: 2, now },
    );

    expect(result.days).toEqual(["2026-11-22", "2026-11-23"]);
  });

  it("queries from the start of the first day until the end of the last", async () => {
    const repository = repositoryReturning();

    await getAvailabilitySeries(
      { pickupRepository: repository },
      { days: 2, now: new Date("2026-11-24T15:00:00Z") },
    );

    const args = repository.getAvailabilitySeries.mock.calls[0][0];
    expect(args.startDate.toISOString()).toBe("2026-11-23T03:00:00.000Z");
    expect(args.endDate.toISOString()).toBe("2026-11-25T02:59:59.999Z");
  });

  it("groups rows by insulin type and variant", async () => {
    const rows = [
      {
        day: "2026-11-23",
        type: "REFILL",
        variant: "NPH",
        pickupsWithStock: "10",
        totalQuantity: "400",
        pickupsReported: "12",
      },
      {
        day: "2026-11-24",
        type: "REFILL",
        variant: "NPH",
        pickupsWithStock: "8",
        totalQuantity: "320",
        pickupsReported: "12",
      },
      {
        day: "2026-11-24",
        type: "CANETA",
        variant: "REGULAR",
        pickupsWithStock: "1",
        totalQuantity: "2",
        pickupsReported: "12",
      },
    ];

    const result = await getAvailabilitySeries(
      { pickupRepository: repositoryReturning(rows) },
      { days: 2, now: new Date("2026-11-24T15:00:00Z") },
    );

    expect(result.series).toEqual([
      {
        type: "REFILL",
        variant: "NPH",
        points: [
          {
            day: "2026-11-23",
            pickupsWithStock: 10,
            totalQuantity: 400,
            pickupsReported: 12,
          },
          {
            day: "2026-11-24",
            pickupsWithStock: 8,
            totalQuantity: 320,
            pickupsReported: 12,
          },
        ],
      },
      {
        type: "CANETA",
        variant: "REGULAR",
        points: [
          {
            day: "2026-11-24",
            pickupsWithStock: 1,
            totalQuantity: 2,
            pickupsReported: 12,
          },
        ],
      },
    ]);
  });

  it("forwards the pickup uuid when the series is scoped", async () => {
    const repository = repositoryReturning();

    await getAvailabilitySeries(
      { pickupRepository: repository },
      { days: 7, pickupId: "uuid-1", now: new Date("2026-11-24T15:00:00Z") },
    );

    expect(repository.getAvailabilitySeries.mock.calls[0][0].pickupId).toBe(
      "uuid-1",
    );
  });
});
