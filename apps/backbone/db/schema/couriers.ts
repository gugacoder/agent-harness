import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { courierStatusEnum } from "./_enums";
import { companies } from "./companies";
import { profiles } from "./profiles";

export const couriers = pgTable("couriers", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  full_name: text("full_name").notNull(),
  phone: text("phone").notNull(),
  photo_url: text("photo_url"),
  status: courierStatusEnum("status").notNull().default("offline"),
  total_deliveries: integer("total_deliveries").notNull().default(0),
  vehicle_type: text("vehicle_type"),
  plate_number: text("plate_number"),
  active: boolean("active").notNull().default(true),
  vehicle_type: text("vehicle_type"),
  plate: text("plate"),
  cnh: text("cnh"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
