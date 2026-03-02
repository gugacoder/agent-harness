CREATE TYPE "public"."otp_channel" AS ENUM('whatsapp', 'email');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'super_admin';--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_or_email" text NOT NULL,
	"code_hash" text NOT NULL,
	"channel" "otp_channel" NOT NULL,
	"company_id" uuid,
	"attempts" integer DEFAULT 0 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"requested_role" "user_role" NOT NULL,
	"status" "registration_status" DEFAULT 'pending' NOT NULL,
	"extra_data" jsonb,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid
);
--> statement-breakpoint
ALTER TABLE "company_configs" ADD COLUMN "otp_whatsapp_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "company_configs" ADD COLUMN "otp_whatsapp_url" text;--> statement-breakpoint
ALTER TABLE "company_configs" ADD COLUMN "otp_whatsapp_api_key" text;--> statement-breakpoint
ALTER TABLE "company_configs" ADD COLUMN "otp_smtp_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "company_configs" ADD COLUMN "otp_smtp_host" text;--> statement-breakpoint
ALTER TABLE "company_configs" ADD COLUMN "otp_smtp_port" integer;--> statement-breakpoint
ALTER TABLE "company_configs" ADD COLUMN "otp_smtp_user" text;--> statement-breakpoint
ALTER TABLE "company_configs" ADD COLUMN "otp_smtp_pass_encrypted" text;--> statement-breakpoint
ALTER TABLE "company_configs" ADD COLUMN "otp_smtp_from" text;--> statement-breakpoint
ALTER TABLE "company_configs" ADD COLUMN "otp_smtp_tls" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "couriers" ADD COLUMN "plate" text;--> statement-breakpoint
ALTER TABLE "couriers" ADD COLUMN "cnh" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "business_hours" jsonb;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_otp_codes_lookup" ON "otp_codes" ("phone_or_email", "expires_at") WHERE "verified" = false;--> statement-breakpoint
CREATE INDEX "idx_otp_codes_expires" ON "otp_codes" ("expires_at") WHERE "verified" = false;--> statement-breakpoint
CREATE INDEX "idx_registration_requests_company_status" ON "registration_requests" ("company_id", "status") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_registration_requests_phone" ON "registration_requests" ("phone", "company_id");