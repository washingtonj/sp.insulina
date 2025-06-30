import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { uniqueIndex } from "drizzle-orm/sqlite-core";

// Pickups table (merged address and businessHours as JSON)
export const pickupsModel = sqliteTable("pickups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").notNull().unique(),
  name: text("name").notNull().unique(),
  address: text("address", { mode: "json" }).notNull(), // JSON: { address, latitude, longitude }
  business_hours: text("business_hours", { mode: "json" }).notNull(), // JSON: BusinessHourEntity[]
});

// Insulins table (restored for insulin metadata)
export const insulinsModel = sqliteTable("insulins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  simpleName: text("simpleName").notNull(),
  type: text("type").notNull(), // e.g., 'CANETA', 'AMPOLA', 'REFILL'
  variant: text("variant").notNull(), // e.g., 'NPH', 'REGULAR'
});

// Availabilities table (reflects unique constraint on pickup_id + checked_at)
export const availabilitiesModel = sqliteTable(
  "availabilities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pickup_id: integer("pickup_id").notNull(),
    checked_at: text("checked_at").notNull(),
    data: text("data").notNull(), // JSON: array of { insulinCode, quantity, level }
  },
  (table) => ({
    uniqPickupCheckedAt: uniqueIndex(
      "uniq_availabilities_pickup_id_checked_at",
    ).on(table.pickup_id, table.checked_at),
  }),
);

export const lastAvailabilitiesModel = sqliteTable("latest_availabilities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pickup_id: integer("pickup_id").notNull(),
  checked_at: text("checked_at").notNull(),
  data: text("data").notNull(), // JSON: array of { insulinCode, quantity, level }
});
