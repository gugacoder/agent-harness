import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { profiles } from "./profiles";

export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  trade_name: text("trade_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
