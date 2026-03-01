import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { orderStatusEnum } from "./_enums";
import { companies } from "./companies";
import { shops } from "./shops";
import { profiles } from "./profiles";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  shop_id: uuid("shop_id").references(() => shops.id, {
    onDelete: "restrict",
  }),
  order_number: integer("order_number").notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  pickup_address: text("pickup_address").notNull(),
  pickup_lat: numeric("pickup_lat", { precision: 10, scale: 7 }).notNull(),
  pickup_lng: numeric("pickup_lng", { precision: 10, scale: 7 }).notNull(),
  delivery_address: text("delivery_address").notNull(),
  delivery_lat: numeric("delivery_lat", { precision: 10, scale: 7 }).notNull(),
  delivery_lng: numeric("delivery_lng", { precision: 10, scale: 7 }).notNull(),
  recipient_name: text("recipient_name").notNull(),
  recipient_phone: text("recipient_phone").notNull(),
  notes: text("notes"),
  created_by: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
