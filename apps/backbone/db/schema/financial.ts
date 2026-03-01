import {
  pgTable,
  uuid,
  date,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { closingStatusEnum } from "./_enums";
import { companies } from "./companies";
import { couriers } from "./couriers";
import { deliveries } from "./deliveries";

export const financialClosings = pgTable("financial_closings", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  courier_id: uuid("courier_id")
    .notNull()
    .references(() => couriers.id, { onDelete: "restrict" }),
  period_start: date("period_start").notNull(),
  period_end: date("period_end").notNull(),
  total_deliveries: integer("total_deliveries").notNull(),
  total_distance_km: numeric("total_distance_km", { precision: 10, scale: 2 }).notNull(),
  total_amount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: closingStatusEnum("status").notNull(),
  confirmed_at: timestamp("confirmed_at", { withTimezone: true, mode: "string" }),
  paid_at: timestamp("paid_at", { withTimezone: true, mode: "string" }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const financialClosingItems = pgTable("financial_closing_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  closing_id: uuid("closing_id")
    .notNull()
    .references(() => financialClosings.id, { onDelete: "cascade" }),
  delivery_id: uuid("delivery_id")
    .notNull()
    .references(() => deliveries.id, { onDelete: "restrict" }),
  delivery_price: numeric("delivery_price", { precision: 10, scale: 2 }).notNull(),
  distance_km: numeric("distance_km", { precision: 8, scale: 2 }).notNull(),
  delivered_at: timestamp("delivered_at", { withTimezone: true, mode: "string" }).notNull(),
});
