import {
  pgTable,
  uuid,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { closingPeriodEnum } from "./_enums";
import { companies } from "./companies";

export const companyConfigs = pgTable("company_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id")
    .notNull()
    .unique()
    .references(() => companies.id, { onDelete: "restrict" }),
  pod_required: boolean("pod_required").notNull().default(false),
  default_closing_period: closingPeriodEnum("default_closing_period").notNull().default("weekly"),
  default_invoice_period: closingPeriodEnum("default_invoice_period").notNull().default("monthly"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
