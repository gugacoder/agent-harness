import {
  pgTable,
  uuid,
  numeric,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { deliveryStatusEnum } from "./_enums.js";
import { orders } from "./orders.js";
import { couriers } from "./couriers.js";
import { companies } from "./companies.js";

export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "restrict" }),
  courier_id: uuid("courier_id")
    .notNull()
    .references(() => couriers.id, { onDelete: "restrict" }),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  status: deliveryStatusEnum("status").notNull().default("assigned"),
  assigned_at: timestamp("assigned_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  accepted_at: timestamp("accepted_at", {
    withTimezone: true,
    mode: "string",
  }),
  picked_up_at: timestamp("picked_up_at", {
    withTimezone: true,
    mode: "string",
  }),
  delivered_at: timestamp("delivered_at", {
    withTimezone: true,
    mode: "string",
  }),
  actual_distance_km: numeric("actual_distance_km", {
    precision: 8,
    scale: 2,
  }),
  actual_duration_min: integer("actual_duration_min"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
