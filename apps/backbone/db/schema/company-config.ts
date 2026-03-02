import {
  pgTable,
  uuid,
  boolean,
  text,
  integer,
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
  otp_whatsapp_enabled: boolean("otp_whatsapp_enabled").notNull().default(false),
  otp_whatsapp_url: text("otp_whatsapp_url"),
  otp_whatsapp_api_key: text("otp_whatsapp_api_key"),
  otp_smtp_enabled: boolean("otp_smtp_enabled").notNull().default(false),
  otp_smtp_host: text("otp_smtp_host"),
  otp_smtp_port: integer("otp_smtp_port"),
  otp_smtp_user: text("otp_smtp_user"),
  otp_smtp_pass_encrypted: text("otp_smtp_pass_encrypted"),
  otp_smtp_from: text("otp_smtp_from"),
  otp_smtp_tls: boolean("otp_smtp_tls").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
