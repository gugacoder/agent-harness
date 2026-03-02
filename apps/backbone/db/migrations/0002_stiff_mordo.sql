CREATE TYPE "public"."onboarding_flow" AS ENUM('wizard', 'tutorial', 'guided_overlay');--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"flow" "onboarding_flow" NOT NULL,
	"step_key" text NOT NULL,
	"metadata" jsonb,
	"completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_onboarding_profile_flow" ON "onboarding_progress" USING btree ("profile_id","flow");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_onboarding_unique_step" ON "onboarding_progress" USING btree ("profile_id","flow","step_key");