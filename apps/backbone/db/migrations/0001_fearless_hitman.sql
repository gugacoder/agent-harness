CREATE TYPE "public"."closing_period" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."closing_status" AS ENUM('draft', 'confirmed', 'paid');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid');--> statement-breakpoint
CREATE TYPE "public"."pricing_rule_type" AS ENUM('per_km', 'distance_range', 'neighborhood', 'flat_rate', 'surcharge');--> statement-breakpoint
CREATE TYPE "public"."surcharge_mode" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."surcharge_type" AS ENUM('rain', 'night', 'weekend');--> statement-breakpoint
CREATE TABLE "company_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"pod_required" boolean DEFAULT false NOT NULL,
	"default_closing_period" "closing_period" DEFAULT 'weekly' NOT NULL,
	"default_invoice_period" "closing_period" DEFAULT 'monthly' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_configs_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "delivery_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"pricing_table_id" uuid NOT NULL,
	"pricing_rule_id" uuid NOT NULL,
	"estimated_distance_km" numeric(8, 2) NOT NULL,
	"actual_distance_km" numeric(8, 2),
	"base_price" numeric(10, 2) NOT NULL,
	"surcharge_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"calculated_at" timestamp with time zone NOT NULL,
	"recalculated_at" timestamp with time zone,
	CONSTRAINT "delivery_prices_delivery_id_unique" UNIQUE("delivery_id")
);
--> statement-breakpoint
CREATE TABLE "delivery_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"courier_id" uuid NOT NULL,
	"photo_url" text NOT NULL,
	"signature_url" text NOT NULL,
	"lat" numeric(10, 7) NOT NULL,
	"lng" numeric(10, 7) NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_proofs_delivery_id_unique" UNIQUE("delivery_id")
);
--> statement-breakpoint
CREATE TABLE "financial_closing_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"closing_id" uuid NOT NULL,
	"delivery_id" uuid NOT NULL,
	"delivery_price" numeric(10, 2) NOT NULL,
	"distance_km" numeric(8, 2) NOT NULL,
	"delivered_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_closings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"courier_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"total_deliveries" integer NOT NULL,
	"total_distance_km" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "closing_status" NOT NULL,
	"confirmed_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"delivery_id" uuid NOT NULL,
	"order_number" integer NOT NULL,
	"pickup_address" text NOT NULL,
	"delivery_address" text NOT NULL,
	"distance_km" numeric(8, 2) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"delivered_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"invoice_number" integer NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"total_deliveries" integer NOT NULL,
	"total_distance_km" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "invoice_status" NOT NULL,
	"sent_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pricing_table_id" uuid NOT NULL,
	"rule_type" "pricing_rule_type" NOT NULL,
	"base_value" numeric(10, 2) NOT NULL,
	"per_km_value" numeric(10, 2),
	"min_distance_km" numeric(8, 2),
	"max_distance_km" numeric(8, 2),
	"neighborhood" text,
	"surcharge_type" "surcharge_type",
	"surcharge_mode" "surcharge_mode",
	"surcharge_value" numeric(10, 2),
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_pricing_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"pricing_table_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_pricing_overrides_shop_id_unique" UNIQUE("shop_id")
);
--> statement-breakpoint
ALTER TABLE "company_configs" ADD CONSTRAINT "company_configs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_prices" ADD CONSTRAINT "delivery_prices_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_prices" ADD CONSTRAINT "delivery_prices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_prices" ADD CONSTRAINT "delivery_prices_pricing_table_id_pricing_tables_id_fk" FOREIGN KEY ("pricing_table_id") REFERENCES "public"."pricing_tables"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_prices" ADD CONSTRAINT "delivery_prices_pricing_rule_id_pricing_rules_id_fk" FOREIGN KEY ("pricing_rule_id") REFERENCES "public"."pricing_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_courier_id_couriers_id_fk" FOREIGN KEY ("courier_id") REFERENCES "public"."couriers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_closing_items" ADD CONSTRAINT "financial_closing_items_closing_id_financial_closings_id_fk" FOREIGN KEY ("closing_id") REFERENCES "public"."financial_closings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_closing_items" ADD CONSTRAINT "financial_closing_items_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_closings" ADD CONSTRAINT "financial_closings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_closings" ADD CONSTRAINT "financial_closings_courier_id_couriers_id_fk" FOREIGN KEY ("courier_id") REFERENCES "public"."couriers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_pricing_table_id_pricing_tables_id_fk" FOREIGN KEY ("pricing_table_id") REFERENCES "public"."pricing_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_tables" ADD CONSTRAINT "pricing_tables_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_pricing_overrides" ADD CONSTRAINT "shop_pricing_overrides_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_pricing_overrides" ADD CONSTRAINT "shop_pricing_overrides_pricing_table_id_pricing_tables_id_fk" FOREIGN KEY ("pricing_table_id") REFERENCES "public"."pricing_tables"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_pricing_overrides" ADD CONSTRAINT "shop_pricing_overrides_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

-- ============================================================
-- Indices Recomendados Wave 2 (chegala-er.md)
-- ============================================================

-- Tabelas de preco por empresa
CREATE INDEX "idx_pricing_tables_company" ON "pricing_tables"("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pricing_tables_company_active" ON "pricing_tables"("company_id") WHERE "active" = true;--> statement-breakpoint

-- Regras por tabela
CREATE INDEX "idx_pricing_rules_table" ON "pricing_rules"("pricing_table_id", "priority");--> statement-breakpoint

-- Fechamentos por empresa e motoboy
CREATE INDEX "idx_closings_company" ON "financial_closings"("company_id", "status");--> statement-breakpoint
CREATE INDEX "idx_closings_courier" ON "financial_closings"("courier_id", "period_start" DESC);--> statement-breakpoint

-- Items do fechamento
CREATE INDEX "idx_closing_items_closing" ON "financial_closing_items"("closing_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_closing_items_delivery" ON "financial_closing_items"("delivery_id");--> statement-breakpoint

-- Faturas por empresa e lojista
CREATE INDEX "idx_invoices_company" ON "invoices"("company_id", "status");--> statement-breakpoint
CREATE INDEX "idx_invoices_shop" ON "invoices"("shop_id", "period_start" DESC);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invoices_company_number" ON "invoices"("company_id", "invoice_number");--> statement-breakpoint

-- Items da fatura
CREATE INDEX "idx_invoice_items_invoice" ON "invoice_items"("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invoice_items_delivery" ON "invoice_items"("delivery_id");--> statement-breakpoint

-- ============================================================
-- Triggers Wave 2 (chegala-er.md)
-- ============================================================

-- Atualizar updated_at nas novas tabelas
CREATE TRIGGER trg_company_configs_updated_at BEFORE UPDATE ON "company_configs" FOR EACH ROW EXECUTE FUNCTION update_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_pricing_tables_updated_at BEFORE UPDATE ON "pricing_tables" FOR EACH ROW EXECUTE FUNCTION update_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_closings_updated_at BEFORE UPDATE ON "financial_closings" FOR EACH ROW EXECUTE FUNCTION update_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON "invoices" FOR EACH ROW EXECUTE FUNCTION update_updated_at();--> statement-breakpoint

-- Gerar invoice_number sequencial por empresa
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number = (
    SELECT COALESCE(MAX(invoice_number), 0) + 1
    FROM invoices
    WHERE company_id = NEW.company_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE TRIGGER trg_invoices_number BEFORE INSERT ON "invoices" FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();--> statement-breakpoint

-- Garantir apenas uma pricing_table ativa por empresa
CREATE OR REPLACE FUNCTION enforce_single_active_pricing_table()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active = true THEN
    UPDATE pricing_tables
    SET active = false
    WHERE company_id = NEW.company_id AND id != NEW.id AND active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE TRIGGER trg_pricing_tables_single_active BEFORE INSERT OR UPDATE ON "pricing_tables" FOR EACH ROW EXECUTE FUNCTION enforce_single_active_pricing_table();