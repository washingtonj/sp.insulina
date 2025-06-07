import { PickupEntity } from "@sp-insulina/core/entities/pickup";
import { PickupRepository } from "@sp-insulina/core/interfaces/pickup-repository";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import {
  addressesModel,
  availabilitiesModel,
  businessHoursModel,
  pickupsModel,
  insulinsModel,
} from "./schema";
import { transformPickupsQueryResults } from "./transform";

export function pickupRepositoryWithD1(db: D1Database): PickupRepository {
  const drizzleDb = drizzle(db);

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
            checked_at: new Date().toISOString(),
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
          availabilitiesModel,
          eq(pickupsModel.id, availabilitiesModel.pickup_id),
        )
        .leftJoin(
          insulinsModel,
          eq(availabilitiesModel.insulin_id, insulinsModel.id),
        );

      return transformPickupsQueryResults(results);
    },
  };
}
