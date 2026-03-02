import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import { onboardingProgress } from "../../db/schema/index.js";

/**
 * Get onboarding progress for a profile, optionally filtered by flow.
 */
export async function getOnboardingProgress(
  profileId: string,
  flow?: "wizard" | "tutorial" | "guided_overlay"
) {
  const conditions = [eq(onboardingProgress.profile_id, profileId)];

  if (flow) {
    conditions.push(eq(onboardingProgress.flow, flow));
  }

  return db
    .select()
    .from(onboardingProgress)
    .where(and(...conditions));
}

/**
 * Complete an onboarding step. Idempotent — uses ON CONFLICT DO NOTHING
 * so duplicate (profile_id, flow, step_key) inserts are silently ignored.
 */
export async function completeOnboardingStep(
  profileId: string,
  params: {
    flow: "wizard" | "tutorial" | "guided_overlay";
    step_key: string;
    metadata?: Record<string, unknown>;
  }
) {
  const now = new Date().toISOString();

  const [step] = await db
    .insert(onboardingProgress)
    .values({
      profile_id: profileId,
      flow: params.flow,
      step_key: params.step_key,
      metadata: params.metadata ?? null,
      completed_at: now,
    })
    .onConflictDoNothing({
      target: [
        onboardingProgress.profile_id,
        onboardingProgress.flow,
        onboardingProgress.step_key,
      ],
    })
    .returning();

  // If conflict (already exists), fetch the existing record
  if (!step) {
    const [existing] = await db
      .select()
      .from(onboardingProgress)
      .where(
        and(
          eq(onboardingProgress.profile_id, profileId),
          eq(onboardingProgress.flow, params.flow),
          eq(onboardingProgress.step_key, params.step_key)
        )
      );
    return existing;
  }

  return step;
}

/**
 * Reset onboarding progress — deletes all steps for a profile + flow.
 */
export async function resetOnboardingProgress(
  profileId: string,
  flow: "wizard" | "tutorial" | "guided_overlay"
) {
  await db
    .delete(onboardingProgress)
    .where(
      and(
        eq(onboardingProgress.profile_id, profileId),
        eq(onboardingProgress.flow, flow)
      )
    );
}
