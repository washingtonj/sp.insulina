import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type {
  AvailabilitySnapshot,
  DayOfWeek,
  InsulinType,
  InsulinVariant,
} from "../../../domain/entities/index.ts";

export type StoredAddress = {
  address: string;
  latitude: number;
  longitude: number;
};

export type StoredBusinessHour = {
  dayOfWeek: DayOfWeek;
  hours: [string, string];
};

export const pickupsModel = pgTable("pickups", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  name: text("name").notNull().unique(),
  address: jsonb("address").$type<StoredAddress>().notNull(),
  business_hours: jsonb("business_hours").$type<StoredBusinessHour[]>().notNull(),
});

export const insulinsModel = pgTable("insulins", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  simpleName: text("simple_name").notNull(),
  type: text("type").$type<InsulinType>().notNull(),
  variant: text("variant").$type<InsulinVariant>().notNull(),
});

export const availabilitiesModel = pgTable(
  "availabilities",
  {
    id: serial("id").primaryKey(),
    pickup_id: integer("pickup_id")
      .notNull()
      .references(() => pickupsModel.id, { onDelete: "cascade" }),
    checked_at: timestamp("checked_at", { withTimezone: true }).notNull(),
    data: jsonb("data").$type<AvailabilitySnapshot[]>().notNull(),
  },
  (table) => [
    uniqueIndex("uniq_availabilities_pickup_id_checked_at").on(
      table.pickup_id,
      table.checked_at,
    ),
    index("idx_availabilities_pickup_id").on(table.pickup_id),
    index("idx_availabilities_checked_at").on(table.checked_at),
    index("idx_availabilities_pickup_id_checked_at_desc").on(
      table.pickup_id,
      table.checked_at.desc(),
    ),
  ],
);

export const lastAvailabilitiesModel = pgTable("latest_availabilities", {
  id: serial("id").primaryKey(),
  pickup_id: integer("pickup_id")
    .notNull()
    .unique()
    .references(() => pickupsModel.id, { onDelete: "cascade" }),
  checked_at: timestamp("checked_at", { withTimezone: true }).notNull(),
  data: jsonb("data").$type<AvailabilitySnapshot[]>().notNull(),
});

export const responseCacheModel = pgTable("response_cache", {
  key: text("key").primaryKey(),
  body: jsonb("body").notNull(),
  cachedAt: timestamp("cached_at", { withTimezone: true }).notNull(),
});
