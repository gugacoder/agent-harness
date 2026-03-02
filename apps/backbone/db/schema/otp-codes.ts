import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { otpChannelEnum } from "./_enums";
import { companies } from "./companies";

export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone_or_email: text("phone_or_email").notNull(),
  code_hash: text("code_hash").notNull(),
  channel: otpChannelEnum("channel").notNull(),
  company_id: uuid("company_id").references(() => companies.id, {
    onDelete: "restrict",
  }),
  attempts: integer("attempts").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  expires_at: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
