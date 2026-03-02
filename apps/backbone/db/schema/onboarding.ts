import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { onboardingFlowEnum } from "./_enums";
import { profiles } from "./profiles";

export const onboardingProgress = pgTable("onboarding_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  flow: onboardingFlowEnum("flow").notNull(),
  step_key: text("step_key").notNull(),
  metadata: jsonb("metadata"),
  completed_at: timestamp("completed_at", { withTimezone: true, mode: "string" })
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("idx_onboarding_profile_flow").on(table.profile_id, table.flow),
  uniqueIndex("idx_onboarding_unique_step").on(table.profile_id, table.flow, table.step_key),
]);
