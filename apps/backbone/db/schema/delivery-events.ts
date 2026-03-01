import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { deliveryEventTypeEnum } from "./_enums.js";
import { deliveries } from "./deliveries.js";
import { profiles } from "./profiles.js";

export const deliveryEvents = pgTable("delivery_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  delivery_id: uuid("delivery_id")
    .notNull()
    .references(() => deliveries.id, { onDelete: "restrict" }),
  event_type: deliveryEventTypeEnum("event_type").notNull(),
  old_status: text("old_status"),
  new_status: text("new_status"),
  description: text("description").notNull(),
  actor_id: uuid("actor_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
