import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { pricingRuleTypeEnum, surchargeTypeEnum, surchargeModeEnum } from "./_enums";
import { companies } from "./companies";
import { shops } from "./shops";

export const pricingTables = pgTable("pricing_tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const pricingRules = pgTable("pricing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  pricing_table_id: uuid("pricing_table_id")
    .notNull()
    .references(() => pricingTables.id, { onDelete: "cascade" }),
  rule_type: pricingRuleTypeEnum("rule_type").notNull(),
  base_value: numeric("base_value", { precision: 10, scale: 2 }).notNull(),
  per_km_value: numeric("per_km_value", { precision: 10, scale: 2 }),
  min_distance_km: numeric("min_distance_km", { precision: 8, scale: 2 }),
  max_distance_km: numeric("max_distance_km", { precision: 8, scale: 2 }),
  neighborhood: text("neighborhood"),
  surcharge_type: surchargeTypeEnum("surcharge_type"),
  surcharge_mode: surchargeModeEnum("surcharge_mode"),
  surcharge_value: numeric("surcharge_value", { precision: 10, scale: 2 }),
  priority: integer("priority").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const shopPricingOverrides = pgTable("shop_pricing_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  shop_id: uuid("shop_id")
    .notNull()
    .unique()
    .references(() => shops.id, { onDelete: "restrict" }),
  pricing_table_id: uuid("pricing_table_id")
    .notNull()
    .references(() => pricingTables.id, { onDelete: "restrict" }),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
