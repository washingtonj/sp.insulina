import type { PickupEntity } from "domain/entities";
import type {
  AvailabilitySeriesRow,
  PickupRepository,
  BestDayRow,
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

    async getAvailabilitySeries(args) {
      const pickupFilter = args.pickupId
        ? sql`AND p.uuid = ${args.pickupId}`
        : sql``;

      const rows = await drizzleDb.all<AvailabilitySeriesRow>(sql`
        WITH ranked AS (
          SELECT a.pickup_id AS pickup_id,
                 date(a.checked_at, '-3 hours') AS day,
                 a.data AS data,
                 ROW_NUMBER() OVER (
                   PARTITION BY a.pickup_id, date(a.checked_at, '-3 hours')
                   ORDER BY a.checked_at DESC
                 ) AS position
          FROM availabilities a
          JOIN pickups p ON p.id = a.pickup_id
          WHERE a.checked_at >= ${args.startDate.toISOString()}
            AND a.checked_at <= ${args.endDate.toISOString()}
            ${pickupFilter}
        )
        SELECT r.day AS day,
               i.type AS type,
               i.variant AS variant,
               COUNT(*) FILTER (WHERE json_extract(j.value, '$.quantity') > 0) AS pickupsWithStock,
               COALESCE(SUM(json_extract(j.value, '$.quantity')), 0) AS totalQuantity,
               COUNT(*) AS pickupsReported
        FROM ranked r
        CROSS JOIN json_each(r.data) j
        JOIN insulins i ON i.code = json_extract(j.value, '$.insulinCode')
        WHERE r.position = 1
        GROUP BY r.day, i.type, i.variant
        ORDER BY r.day, i.type, i.variant
      `);

      return rows;
    },

    async getBestDayProfile(args) {
      const rows = await drizzleDb.all<BestDayRow>(sql`
        WITH readings AS (
          SELECT a.pickup_id AS pickup_id,
                 a.checked_at AS checked_at,
                 date(a.checked_at, '-3 hours') AS day,
                 SUM(CAST(json_extract(j.value, '$.quantity') AS INTEGER)) AS units
          FROM availabilities a
          CROSS JOIN json_each(a.data) j
          JOIN insulins i ON i.code = json_extract(j.value, '$.insulinCode')
          WHERE a.checked_at >= ${args.startDate.toISOString()}
            AND a.checked_at <= ${args.endDate.toISOString()}
            AND i.type IN ('REFILL', 'AMPOLA')
          GROUP BY a.pickup_id, a.checked_at, day
        ),
        daily AS (
          SELECT pickup_id, day, units,
                 ROW_NUMBER() OVER (
                   PARTITION BY pickup_id, day
                   ORDER BY checked_at DESC
                 ) AS position
          FROM readings
        ),
        best_days AS (
          SELECT pickup_id,
                 CAST(strftime('%d', day) AS INTEGER) AS day_of_month,
                 AVG(units) AS average_units,
                 COUNT(*) AS samples
          FROM daily
          WHERE position = 1
          GROUP BY pickup_id, day_of_month
        ),
        ranked AS (
          SELECT pickup_id, day_of_month, average_units, samples,
                 ROW_NUMBER() OVER (
                   PARTITION BY pickup_id
                   ORDER BY average_units DESC, day_of_month
                 ) AS place
          FROM best_days
        )
        SELECT p.uuid AS uuid,
               r.day_of_month AS dayOfMonth,
               CAST(ROUND(r.average_units) AS INTEGER) AS averageUnits,
               r.samples AS samples
        FROM ranked r
        JOIN pickups p ON p.id = r.pickup_id
        WHERE r.place = 1
        ORDER BY p.uuid
      `);

      return rows;
    },
  };
}
