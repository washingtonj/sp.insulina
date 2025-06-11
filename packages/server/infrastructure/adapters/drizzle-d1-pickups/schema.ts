import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

// Addresses table
export const addressesModel = sqliteTable("addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  street: text("street"),
  lat: real("lat"),
  lng: real("lng"),
});

// Pickups table
export const pickupsModel = sqliteTable("pickups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").notNull().unique(),
  name: text("name").notNull().unique(),
  address_id: integer("address_id").notNull(),
});

// Business hours table
export const businessHoursModel = sqliteTable("business_hours", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pickup_id: integer("pickup_id").notNull(),
  day_of_week: integer("day_of_week").notNull(),
  open_time: text("open_time").notNull(),
  close_time: text("close_time").notNull(),
});

// Insulins table
export const insulinsModel = sqliteTable("insulins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  simpleName: text().notNull(),
  type: text("type").notNull(),
});

// Availabilities table
export const availabilitiesModel = sqliteTable("availabilities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pickup_id: integer("pickup_id").notNull(),
  checked_at: text("checked_at").notNull(),
  data: text("data").notNull(),
});
