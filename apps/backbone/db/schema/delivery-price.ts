import {
  pgTable,
  uuid,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { deliveries } from "./deliveries";
import { companies } from "./companies";
import { pricingTables, pricingRules } from "./pricing";

export const deliveryPrices = pgTable("delivery_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  delivery_id: uuid("delivery_id")
    .notNull()
    .unique()
    .references(() => deliveries.id, { onDelete: "restrict" }),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  pricing_table_id: uuid("pricing_table_id")
    .notNull()
    .references(() => pricingTables.id, { onDelete: "restrict" }),
  pricing_rule_id: uuid("pricing_rule_id")
    .notNull()
    .references(() => pricingRules.id, { onDelete: "restrict" }),
  estimated_distance_km: numeric("estimated_distance_km", { precision: 8, scale: 2 }).notNull(),
  actual_distance_km: numeric("actual_distance_km", { precision: 8, scale: 2 }),
  base_price: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  surcharge_amount: numeric("surcharge_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  total_price: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  calculated_at: timestamp("calculated_at", { withTimezone: true, mode: "string" }).notNull(),
  recalculated_at: timestamp("recalculated_at", { withTimezone: true, mode: "string" }),
});
