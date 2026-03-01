import { pgTable, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { couriers } from "./couriers.js";
import { companies } from "./companies.js";
import { deliveries } from "./deliveries.js";

export const courierLocations = pgTable("courier_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  courier_id: uuid("courier_id")
    .notNull()
    .references(() => couriers.id, { onDelete: "restrict" }),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  delivery_id: uuid("delivery_id").references(() => deliveries.id, {
    onDelete: "restrict",
  }),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  accuracy: numeric("accuracy", { precision: 6, scale: 2 }).notNull(),
  recorded_at: timestamp("recorded_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
