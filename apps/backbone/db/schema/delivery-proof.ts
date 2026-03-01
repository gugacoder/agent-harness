import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { deliveries } from "./deliveries";
import { companies } from "./companies";
import { couriers } from "./couriers";

export const deliveryProofs = pgTable("delivery_proofs", {
  id: uuid("id").primaryKey().defaultRandom(),
  delivery_id: uuid("delivery_id")
    .notNull()
    .unique()
    .references(() => deliveries.id, { onDelete: "restrict" }),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  courier_id: uuid("courier_id")
    .notNull()
    .references(() => couriers.id, { onDelete: "restrict" }),
  photo_url: text("photo_url").notNull(),
  signature_url: text("signature_url").notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  captured_at: timestamp("captured_at", { withTimezone: true, mode: "string" }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
