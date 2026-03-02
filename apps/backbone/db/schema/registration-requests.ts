import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { userRoleEnum, registrationStatusEnum } from "./_enums";
import { companies } from "./companies";
import { profiles } from "./profiles";

export const registrationRequests = pgTable("registration_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  full_name: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  requested_role: userRoleEnum("requested_role").notNull(),
  status: registrationStatusEnum("status").notNull().default("pending"),
  extra_data: jsonb("extra_data"),
  requested_at: timestamp("requested_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  reviewed_at: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),
  reviewed_by: uuid("reviewed_by").references(() => profiles.id, {
    onDelete: "restrict",
  }),
});
