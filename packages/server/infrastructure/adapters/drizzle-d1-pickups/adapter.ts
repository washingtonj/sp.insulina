import type { PickupEntity } from "domain/entities";
import type {
  PickupRepository,
  getAvailabilitiesTypes,
} from "domain/interfaces/pickup-repository";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { and, gte, lte, sql } from "drizzle-orm";
import {
  pickupsModel,
  availabilitiesModel,
  insulinsModel,
  lastAvailabilitiesModel,
} from "./schema";
import { transformPickupsQueryResults } from "./transform";

export function pickupRepositoryWithD1(
  drizzleDb: DrizzleD1Database,
): PickupRepository {
  return {
    async addPickups(pickups: PickupEntity[]): Promise<void> {
      // TODO: Currently, pickups are added individually since the volume is low.
      // In the future, consider batching inserts for improved performance if the number of pickups increases.
      for (const pickup of pickups) {
        await drizzleDb.insert(pickupsModel).values({
          id: undefined, // D1 will auto-generate the ID
          name: pickup.name,
          uuid: crypto.randomUUID(),
          address: JSON.stringify({
            address: pickup.address.address,
            latitude: pickup.address.latitude,
            longitude: pickup.address.longitude,
          }),
          business_hours: JSON.stringify(
            pickup.businessHours.map((bh) => ({
              dayOfWeek: bh.dayOfWeek,
              hours: bh.hours,
            })),
          ),
        });
      }
    },

    async updateAvailabilities(pickups: PickupEntity[]): Promise<void> {
      const CHECK_DATE = new Date().toISOString();

      const pickupsRows = await drizzleDb
        .select({
          id: pickupsModel.id,
          uuid: pickupsModel.uuid,
        })
        .from(pickupsModel);

      const availabilitiesToBeAdded = pickups
        .map((pickup) => {
          const pickupDatabaseId = pickupsRows.find(
            (p) => p.uuid === pickup.id,
          );

          if (!pickupDatabaseId) return null;

          const availabilityData = pickup.availability.map((availability) => ({
            insulinCode: availability.insulin.code,
            quantity: availability.quantity,
            level: availability.level,
          }));

          return {
            pickup_id: pickupDatabaseId.id,
            checked_at: CHECK_DATE,
            data: JSON.stringify(availabilityData),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const CHUNK_SIZE = 20;
      const chunks = Array.from(
        { length: Math.ceil(availabilitiesToBeAdded.length / CHUNK_SIZE) },
        (_, i) =>
          availabilitiesToBeAdded.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );

      for (const chunk of chunks) {
        await drizzleDb.batch([
          drizzleDb.insert(availabilitiesModel).values(chunk),
          drizzleDb
            .insert(availabilitiesModel)
            .values(chunk)
            .onConflictDoUpdate({
              target: [
                availabilitiesModel.pickup_id,
                availabilitiesModel.checked_at,
              ],
              set: {
                checked_at: sql`excluded.checked_at`,
                data: sql`excluded.data`,
              },
            }),
        ]);
      }

      // Upsert latest availability for each pickup into latest_availabilities
      for (const pickup of pickups) {
        const pickupDatabaseId = pickupsRows.find((p) => p.uuid === pickup.id);
        if (!pickupDatabaseId) continue;

        const availabilityData = pickup.availability.map((availability) => ({
          insulinCode: availability.insulin.code,
          quantity: availability.quantity,
          level: availability.level,
        }));

        await drizzleDb
          .insert(lastAvailabilitiesModel)
          .values({
            pickup_id: pickupDatabaseId.id,
            checked_at: CHECK_DATE,
            data: JSON.stringify(availabilityData),
          })
          .onConflictDoUpdate({
            target: [lastAvailabilitiesModel.pickup_id],
            set: {
              checked_at: sql`excluded.checked_at`,
              data: sql`excluded.data`,
            },
          });
      }
    },

    async getAllPickups(): Promise<PickupEntity[]> {
      const [pickupsRows, insulinsRows, latestAvailabilitiesRows] =
        await drizzleDb.batch([
          drizzleDb.select().from(pickupsModel),
          drizzleDb.select().from(insulinsModel),
          drizzleDb.select().from(lastAvailabilitiesModel),
        ]);

      const insulinsMap = new Map(insulinsRows.map((ins) => [ins.code, ins]));
      const latestAvailabilitiesMap = new Map(
        latestAvailabilitiesRows.map((row) => [row.pickup_id, row]),
      );

      const results = pickupsRows.map((pickup) => ({
        pickup,
        availability: latestAvailabilitiesMap.get(pickup.id) || null,
      }));

      return transformPickupsQueryResults(results, insulinsMap);
    },

    async getAvailabilities(args) {
      const fromdb = await drizzleDb
        .select({
          pickup_id: availabilitiesModel.pickup_id,
          data: availabilitiesModel.data,
          checked_at: availabilitiesModel.checked_at,
        })
        .from(availabilitiesModel)
        .where(
          and(
            gte(availabilitiesModel.checked_at, args.startDate.toISOString()),
            lte(availabilitiesModel.checked_at, args.endDate.toISOString()),
          ),
        );

      // Map pickup_id to uuid
      const pickupsRows = await drizzleDb.select().from(pickupsModel);
      const idToUuid = new Map(pickupsRows.map((p) => [p.id, p.uuid]));

      return fromdb.reduce((acc, item) => {
        const pickupId = idToUuid.get(item.pickup_id);
        const checkedAt = item.checked_at;
        const data = JSON.parse(item.data);

        if (!pickupId) return acc;

        if (!acc[pickupId]) {
          acc[pickupId] = {};
        }

        acc[pickupId][checkedAt] = data;
        return acc;
      }, {} as any) satisfies getAvailabilitiesTypes["response"];
    },
  };
}
