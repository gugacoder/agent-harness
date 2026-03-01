import {
  pgTable,
  uuid,
  integer,
  date,
  text,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { invoiceStatusEnum } from "./_enums";
import { companies } from "./companies";
import { shops } from "./shops";
import { deliveries } from "./deliveries";

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  shop_id: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "restrict" }),
  invoice_number: integer("invoice_number").notNull(),
  period_start: date("period_start").notNull(),
  period_end: date("period_end").notNull(),
  total_deliveries: integer("total_deliveries").notNull(),
  total_distance_km: numeric("total_distance_km", { precision: 10, scale: 2 }).notNull(),
  total_amount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").notNull(),
  sent_at: timestamp("sent_at", { withTimezone: true, mode: "string" }),
  paid_at: timestamp("paid_at", { withTimezone: true, mode: "string" }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoice_id: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  delivery_id: uuid("delivery_id")
    .notNull()
    .references(() => deliveries.id, { onDelete: "restrict" }),
  order_number: integer("order_number").notNull(),
  pickup_address: text("pickup_address").notNull(),
  delivery_address: text("delivery_address").notNull(),
  distance_km: numeric("distance_km", { precision: 8, scale: 2 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  delivered_at: timestamp("delivered_at", { withTimezone: true, mode: "string" }).notNull(),
});
