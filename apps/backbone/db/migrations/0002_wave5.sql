CREATE TABLE "saved_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"label" text,
	"address" text NOT NULL,
	"lat" numeric(10, 7) NOT NULL,
	"lng" numeric(10, 7) NOT NULL,
	"complement" text,
	"reference" text,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"use_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "couriers" ADD COLUMN "vehicle_type" text;--> statement-breakpoint
ALTER TABLE "couriers" ADD COLUMN "plate_number" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "contact_name" text;--> statement-breakpoint
ALTER TABLE "saved_addresses" ADD CONSTRAINT "saved_addresses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_addresses" ADD CONSTRAINT "saved_addresses_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- ============================================================
-- Indices Wave 5 — saved_addresses
-- ============================================================

-- Busca por perfil com favoritos e mais usados primeiro
CREATE INDEX "idx_saved_addresses_profile" ON "saved_addresses"("profile_id", "is_favorite" DESC, "use_count" DESC);--> statement-breakpoint

-- Busca por empresa
CREATE INDEX "idx_saved_addresses_company" ON "saved_addresses"("company_id");--> statement-breakpoint

-- Busca por label (parcial — apenas onde label nao e nulo)
CREATE INDEX "idx_saved_addresses_label" ON "saved_addresses"("profile_id", "label") WHERE "label" IS NOT NULL;--> statement-breakpoint

-- Busca por uso recente
CREATE INDEX "idx_saved_addresses_recent" ON "saved_addresses"("profile_id", "last_used_at" DESC NULLS LAST);--> statement-breakpoint

-- ============================================================
-- Trigger Wave 5 — saved_addresses updated_at
-- ============================================================

CREATE TRIGGER trg_saved_addresses_updated_at BEFORE UPDATE ON "saved_addresses" FOR EACH ROW EXECUTE FUNCTION update_updated_at();