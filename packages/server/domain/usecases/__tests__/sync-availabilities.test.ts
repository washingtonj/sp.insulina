import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { updateAvailability } from "../sync-availabilities";
import {
  createPickup,
  createBusinessHour,
  createAvailability,
} from "./test-utils";

const fixedNow = new Date(Date.UTC(2023, 3, 8, 12, 0, 0)); // 2023-04-08T12:00:00Z (Saturday, 09:00 in São Paulo)

describe("updateAvailability", () => {
  let pickupRepository: any;
  let pickupService: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    pickupRepository = {
      addPickups: vi.fn().mockResolvedValue(undefined),
      updateAvailabilities: vi.fn().mockResolvedValue(undefined),
      getAllPickups: vi.fn().mockResolvedValue([]),
    };

    pickupService = {
      getPickupsAvailabilities: vi.fn().mockResolvedValue([]),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should add new pickups and update only those open now (simple open case)", async () => {
    // Saturday, 09:00 São Paulo
    const openNowPickup = createPickup({
      name: "OpenNow",
      address: "A",
      businessHours: [createBusinessHour(6, "08:00", "18:00")],
      availability: [createAvailability("A1")],
    });

    const closedNowPickup = createPickup({
      name: "ClosedNow",
      address: "B",
      businessHours: [createBusinessHour(6, "18:01", "23:00")],
      availability: [createAvailability("B1")],
    });

    pickupService.getPickupsAvailabilities.mockResolvedValue([
      openNowPickup,
      closedNowPickup,
    ]);
    pickupRepository.getAllPickups.mockResolvedValue([
      openNowPickup,
      closedNowPickup,
    ]);

    await updateAvailability({ pickupRepository, pickupService });

    expect(pickupRepository.updateAvailabilities).toHaveBeenCalledWith([
      expect.objectContaining({ name: "OpenNow" }),
    ]);
  });

  it("should not update when the pickup have the same name as an existing pickup in the repository", async () => {
    const existingPickup = createPickup({
      name: "Existing",
      address: "A",
      businessHours: [createBusinessHour(6, "08:00", "18:00")],
      availability: [createAvailability("A1")],
      id: "id-existing",
    });

    const newPickup = createPickup({
      name: "Existing",
      address: "B",
      businessHours: [createBusinessHour(6, "08:00", "18:00")],
      availability: [createAvailability("B1")],
    });

    pickupRepository.getAllPickups.mockResolvedValue([existingPickup]);
    pickupService.getPickupsAvailabilities.mockResolvedValue([newPickup]);

    const logSpy = vi.spyOn(console, "log");

    await updateAvailability({ pickupRepository, pickupService });

    expect(pickupRepository.addPickups).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("should create new pickups in the repository when new pickups appear in the service list", async () => {
    // Simulate a new pickup from the service that does not exist in the repository
    const newPickup = createPickup({
      name: "BrandNew",
      address: "New Address",
      businessHours: [createBusinessHour(6, "08:00", "18:00")],
      availability: [createAvailability("N1")],
    });

    // Repository has no pickups
    pickupRepository.getAllPickups.mockResolvedValue([]);
    // Service returns a new pickup
    pickupService.getPickupsAvailabilities.mockResolvedValue([newPickup]);

    await updateAvailability({ pickupRepository, pickupService });

    expect(pickupRepository.addPickups).toHaveBeenCalledWith([newPickup]);
  });

  it("should update only 24h pickup if open now", async () => {
    const allDays = Array.from({ length: 7 }, (_, i) =>
      createBusinessHour(i, "00:00", "23:59"),
    );
    const pickup24h = createPickup({
      name: "24h",
      address: "C",
      businessHours: allDays,
      availability: [createAvailability("C1")],
      id: "id-24h",
    });

    pickupService.getPickupsAvailabilities.mockResolvedValue([pickup24h]);
    pickupRepository.getAllPickups.mockResolvedValue([pickup24h]);

    await updateAvailability({ pickupRepository, pickupService });

    expect(pickupRepository.updateAvailabilities).toHaveBeenCalledWith([
      expect.objectContaining({ name: "24h" }),
    ]);
  });

  it("should not update pickups that are closed now", async () => {
    const closedPickup = createPickup({
      name: "Closed",
      address: "D",
      businessHours: [
        createBusinessHour(6, "18:00", "19:00"), // Saturday, but only open 18-19
      ],
      availability: [createAvailability("D1")],
      id: "id-closed",
    });

    pickupService.getPickupsAvailabilities.mockResolvedValue([closedPickup]);
    pickupRepository.getAllPickups.mockResolvedValue([closedPickup]);

    await updateAvailability({ pickupRepository, pickupService });

    expect(pickupRepository.updateAvailabilities).toHaveBeenCalledWith([]);
  });

  it("should handle overnight hours (open past midnight)", async () => {
    // Saturday, 09:00 São Paulo
    const overnightPickup = createPickup({
      name: "Overnight",
      address: "E",
      businessHours: [
        createBusinessHour(6, "22:00", "06:00"), // Saturday 22:00 to Sunday 06:00
      ],
      availability: [createAvailability("E1")],
      id: "id-overnight",
    });

    pickupService.getPickupsAvailabilities.mockResolvedValue([overnightPickup]);
    pickupRepository.getAllPickups.mockResolvedValue([overnightPickup]);

    await updateAvailability({ pickupRepository, pickupService });

    // At 09:00, should be closed
    expect(pickupRepository.updateAvailabilities).toHaveBeenCalledWith([]);
  });

  it("should update weekend-only pickup if today is weekend", async () => {
    // Saturday, 09:00 São Paulo
    const weekendPickup = createPickup({
      name: "Weekend",
      address: "F",
      businessHours: [
        createBusinessHour(6, "08:00", "18:00"), // Saturday open
        createBusinessHour(0, "08:00", "18:00"), // Sunday open
      ],
      availability: [createAvailability("F1")],
      id: "id-weekend",
    });

    pickupService.getPickupsAvailabilities.mockResolvedValue([weekendPickup]);
    pickupRepository.getAllPickups.mockResolvedValue([weekendPickup]);

    await updateAvailability({ pickupRepository, pickupService });

    expect(pickupRepository.updateAvailabilities).toHaveBeenCalledWith([
      expect.objectContaining({ name: "Weekend" }),
    ]);
  });

  it("should treat ['00:00','00:00'] as closed (Sunday case)", async () => {
    // Set to Sunday, 09:00 São Paulo
    const sunday = new Date(Date.UTC(2023, 3, 9, 12, 0, 0)); // 2023-04-09T12:00:00Z (Sunday, 09:00 in São Paulo)
    vi.setSystemTime(sunday);

    const closedSundayPickup = createPickup({
      name: "ClosedSunday",
      address: "Z",
      businessHours: [
        createBusinessHour(0, "00:00", "00:00"), // Sunday closed
        createBusinessHour(6, "08:00", "18:00"), // Saturday open
      ],
      availability: [createAvailability("Z1")],
      id: "id-closed-sunday",
    });

    pickupService.getPickupsAvailabilities.mockResolvedValue([
      closedSundayPickup,
    ]);
    pickupRepository.getAllPickups.mockResolvedValue([closedSundayPickup]);

    await updateAvailability({ pickupRepository, pickupService });

    expect(pickupRepository.updateAvailabilities).toHaveBeenCalledWith([]);
  });

  it("should not update weekend-only pickup if today is weekday", async () => {
    // Set to Monday, 09:00 São Paulo
    const monday = new Date(Date.UTC(2023, 3, 10, 12, 0, 0)); // 2023-04-10T12:00:00Z (Monday, 09:00 in São Paulo)
    vi.setSystemTime(monday);

    const weekendPickup = createPickup({
      name: "Weekend",
      address: "F",
      businessHours: [
        createBusinessHour(6, "08:00", "18:00"), // Saturday open
        createBusinessHour(0, "08:00", "18:00"), // Sunday open
      ],
      availability: [createAvailability("F1")],
      id: "id-weekend",
    });

    pickupService.getPickupsAvailabilities.mockResolvedValue([weekendPickup]);
    pickupRepository.getAllPickups.mockResolvedValue([weekendPickup]);

    await updateAvailability({ pickupRepository, pickupService });

    expect(pickupRepository.updateAvailabilities).toHaveBeenCalledWith([]);
  });

  it("should match pickups by name and address and preserve id", async () => {
    const pickupFromService = createPickup({
      name: "Match",
      address: "G",
      businessHours: [createBusinessHour(6, "08:00", "18:00")],
      availability: [createAvailability("G1")],
    });

    const pickupFromRepo = createPickup({
      id: "id-match",
      name: "Match",
      address: "G",
      businessHours: [createBusinessHour(6, "08:00", "18:00")],
      availability: [createAvailability("G1")],
    });

    pickupService.getPickupsAvailabilities.mockResolvedValue([
      pickupFromService,
    ]);
    pickupRepository.getAllPickups.mockResolvedValue([pickupFromRepo]);

    await updateAvailability({ pickupRepository, pickupService });

    expect(pickupRepository.updateAvailabilities).toHaveBeenCalledWith([
      expect.objectContaining({ id: "id-match" }),
    ]);
  });
});
