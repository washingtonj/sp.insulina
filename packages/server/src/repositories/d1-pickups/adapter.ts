import { PickupRepository } from "@sp-insulina/core/interfaces/pickup-repository";
import type { PickupEntity } from "@sp-insulina/core/entities/pickup";
import type { InsulinEntity } from "@sp-insulina/core/entities/insulin";

const genUUID = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now();

export function D1Pickups(D1Database: D1Database): PickupRepository {
  async function createPickup(pickup: PickupEntity): Promise<string> {
    const address = pickup.address;
    // Insert the address and retrieve its id
    const addressInsert = await D1Database.prepare(
      `INSERT INTO addresses (street, lat, lng)
         VALUES (?, ?, ?) RETURNING id`,
    )
      .bind(address.address, address.latitude, address.longitude)
      .first<{ id: number }>();

    const addressResult = addressInsert;

    const addressId = addressResult?.id;
    const uuid = genUUID();

    const pickupResult = await D1Database.prepare(
      `INSERT INTO pickups (uuid, name, address_id)
         VALUES (?, ?, ?) RETURNING id`,
    )
      .bind(uuid, pickup.name, addressId)
      .first<{ id: number }>();

    const pickupId = pickupResult?.id;

    if (pickup.businessHours) {
      for (const bh of pickup.businessHours) {
        await D1Database.prepare(
          `INSERT INTO business_hours (pickup_id, day_of_week, open_time, close_time)
             VALUES (?, ?, ?, ?)`,
        )
          .bind(pickupId, bh.dayOfWeek, bh.hours[0], bh.hours[1])
          .run();
      }
    }

    return uuid;
  }

  async function createInsulin(insulin: InsulinEntity): Promise<string> {
    const uuid = genUUID();
    await D1Database.prepare(
      `INSERT INTO insulins (uuid, code, name)
         VALUES (?, ?, ?)`,
    )
      .bind(uuid, insulin.code, insulin.fullName || insulin.simpleName || null)
      .run();

    return uuid;
  }

  async function getOrCreatePickup(pickup: PickupEntity): Promise<number> {
    const pickupRow = await D1Database.prepare(
      "SELECT id FROM pickups WHERE name = ?",
    )
      .bind(pickup.name)
      .first<{ id: number }>();

    if (!pickupRow) {
      // Create and then fetch id
      await createPickup(pickup);
      const newRow = await D1Database.prepare(
        "SELECT id FROM pickups WHERE name = ?",
      )
        .bind(pickup.name)
        .first<{ id: number }>();

      return newRow!.id;
    }
    return pickupRow.id;
  }

  async function getOrCreateInsulin(insulin: InsulinEntity): Promise<number> {
    const insulinRow = await D1Database.prepare(
      "SELECT id FROM insulins WHERE code = ?",
    )
      .bind(insulin.code)
      .first<{ id: number }>();

    if (!insulinRow) {
      await createInsulin(insulin);
      const newRow = await D1Database.prepare(
        "SELECT id FROM insulins WHERE code = ?",
      )
        .bind(insulin.code)
        .first<{ id: number }>();

      return newRow!.id;
    }

    return insulinRow.id;
  }

  async function syncNewAvailabilities(pickups: PickupEntity[]): Promise<void> {
    let pickupCount = 0;
    for (const pickup of pickups) {
      pickupCount++;

      const pickupId = await getOrCreatePickup(pickup);

      // Prepare all insulinId lookups in parallel for this pickup
      const insulinIdMap: Record<string, number> = {};
      await Promise.all(
        pickup.availability.map(async (availability) => {
          const insulinId = await getOrCreateInsulin(availability.insulin);
          insulinIdMap[availability.insulin.code] = insulinId;
        }),
      );

      // Batch upsert all availabilities for this pickup
      const statements = pickup.availability.map((availability) =>
        D1Database.prepare(
          `INSERT INTO availabilities (pickup_id, insulin_id, quantity, availabilityLevel, checked_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(pickup_id, insulin_id, checked_at) DO UPDATE SET quantity = excluded.quantity, availabilityLevel = excluded.availabilityLevel`,
        ).bind(
          pickupId,
          insulinIdMap[availability.insulin.code],
          availability.quantity,
          availability.level,
          (availability as any).checked_at ?? new Date().toISOString(),
        ),
      );
      if (statements.length > 0) {
        await D1Database.batch(statements);
      }
    }
  }

  return {
    syncNewAvailabilities,
    createPickup,
    createInsulin,
  };
}
