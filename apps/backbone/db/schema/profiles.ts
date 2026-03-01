import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { userRoleEnum } from "./_enums";
import { companies } from "./companies";

export const profiles = pgTable("profiles", {
  // Same id as auth.users — FK to auth.users added via raw SQL in migrations
  id: uuid("id").primaryKey(),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  role: userRoleEnum("role").notNull(),
  full_name: text("full_name").notNull(),
  phone: text("phone").notNull(),
  avatar_url: text("avatar_url"),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
