import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { profiles } from "./profiles";

export const savedAddresses = pgTable("saved_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  label: text("label"),
  address: text("address").notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  complement: text("complement"),
  reference: text("reference"),
  is_favorite: boolean("is_favorite").notNull().default(false),
  use_count: integer("use_count").notNull().default(0),
  last_used_at: timestamp("last_used_at", {
    withTimezone: true,
    mode: "string",
  }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const savedAddressesRelations = relations(
  savedAddresses,
  ({ one }) => ({
    company: one(companies, {
      fields: [savedAddresses.company_id],
      references: [companies.id],
    }),
    profile: one(profiles, {
      fields: [savedAddresses.profile_id],
      references: [profiles.id],
    }),
  }),
);
