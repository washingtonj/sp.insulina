import { PickupEntity } from "domain/entities/pickup";
import { PickupRepository } from "domain/interfaces/pickup-repository";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, sql, and } from "drizzle-orm";
import {
  addressesModel,
  availabilitiesModel,
  businessHoursModel,
  pickupsModel,
  insulinsModel,
} from "./schema";
import { transformPickupsQueryResults } from "./transform";

export function pickupRepositoryWithD1(
  drizzleDb: DrizzleD1Database,
): PickupRepository {
  return {
    async addPickups(pickups: PickupEntity[]): Promise<void> {
      for (const pickup of pickups) {
        const addressId = await drizzleDb
          .insert(addressesModel)
          .values({
            lat: pickup.address.latitude,
            lng: pickup.address.longitude,
            street: pickup.address.address,
          })
          .returning({ id: addressesModel.id });

        const pickupId = await drizzleDb
          .insert(pickupsModel)
          .values({
            address_id: addressId[0].id,
            name: pickup.name,
            uuid: crypto.randomUUID(),
          })
          .returning({ id: pickupsModel.id });

        await drizzleDb.insert(businessHoursModel).values(
          pickup.businessHours.map((businessHour) => ({
            open_time: businessHour.hours[0],
            close_time: businessHour.hours[1],
            day_of_week: businessHour.dayOfWeek,
            pickup_id: pickupId[0].id,
          })),
        );
      }
    },

    async updateAvailabilities(pickups: PickupEntity[]): Promise<void> {
      const [insulinsCode, pickupsCode] = await drizzleDb.batch([
        drizzleDb
          .select({
            id: insulinsModel.id,
            code: insulinsModel.code,
          })
          .from(insulinsModel),
        drizzleDb
          .select({
            id: pickupsModel.id,
            uuid: pickupsModel.uuid,
          })
          .from(pickupsModel),
      ]);

      let availabilitiesToBeAdded = [];

      const checkDate = new Date().toISOString();

      for (const pickup of pickups) {
        const pickupDatabseId = pickupsCode.find((p) => p.uuid === pickup.id);

        for (const availability of pickup.availability) {
          const insulin = insulinsCode.find(
            (insulin) => insulin.code == availability.insulin.code,
          );

          let insulinId = insulin?.id;

          if (!insulinId) {
            const insulinCreatedId = await drizzleDb
              .insert(insulinsModel)
              .values({
                code: availability.insulin.code,
                name: availability.insulin.name,
                simpleName: availability.insulin.simpleName,
                type: availability.insulin.type,
              })
              .returning({ id: insulinsModel.id });

            insulinId = insulinCreatedId[0].id;

            insulinsCode.push({
              id: insulinId,
              code: availability.insulin.code,
            });
          }

          availabilitiesToBeAdded.push({
            pickup_id: pickupDatabseId!.id,
            insulin_id: insulinId,
            quantity: availability.quantity,
            availabilityLevel: availability.level,
            checked_at: checkDate,
          });
        }
      }

      const chunkSize = 20;
      for (let i = 0; i < availabilitiesToBeAdded.length; i += chunkSize) {
        const chunk = availabilitiesToBeAdded.slice(i, i + chunkSize);
        await drizzleDb.insert(availabilitiesModel).values(chunk);
      }
    },

    async getAllPickups(): Promise<PickupEntity[]> {
      const latestAvailabilities = drizzleDb
        .select({
          pickup_id: availabilitiesModel.pickup_id,
          insulin_id: availabilitiesModel.insulin_id,
          max_checked_at: sql`MAX(${availabilitiesModel.checked_at})`.as(
            "max_checked_at",
          ),
        })
        .from(availabilitiesModel)
        .groupBy(availabilitiesModel.pickup_id, availabilitiesModel.insulin_id)
        .as("latest_availabilities");

      // 2. Main query with join on latest availabilities
      const results = await drizzleDb
        .select({
          pickup: pickupsModel,
          address: addressesModel,
          businessHour: businessHoursModel,
          availability: availabilitiesModel,
          insulin: insulinsModel,
        })
        .from(pickupsModel)
        .innerJoin(
          addressesModel,
          eq(pickupsModel.address_id, addressesModel.id),
        )
        .leftJoin(
          businessHoursModel,
          eq(pickupsModel.id, businessHoursModel.pickup_id),
        )
        .leftJoin(
          latestAvailabilities,
          and(eq(latestAvailabilities.pickup_id, pickupsModel.id)),
        )
        .leftJoin(
          availabilitiesModel,
          and(
            eq(availabilitiesModel.pickup_id, latestAvailabilities.pickup_id),
            eq(availabilitiesModel.insulin_id, latestAvailabilities.insulin_id),
            eq(
              availabilitiesModel.checked_at,
              latestAvailabilities.max_checked_at,
            ),
          ),
        )
        .leftJoin(
          insulinsModel,
          eq(availabilitiesModel.insulin_id, insulinsModel.id),
        );

      return transformPickupsQueryResults(results);
    },
  };
}
